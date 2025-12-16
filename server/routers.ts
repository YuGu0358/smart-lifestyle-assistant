import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Wellness Profile Management
  wellness: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const { getWellnessProfile } = await import("./db");
      return getWellnessProfile(ctx.user.id);
    }),
    update: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ ctx, input }) => {
      const { upsertWellnessProfile } = await import("./db");
      await upsertWellnessProfile(ctx.user.id, input);
      return { success: true };
    }),
  }),

  // Course Schedule Management
  courses: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserCourses } = await import("./db");
      return getUserCourses(ctx.user.id);
    }),
    import: protectedProcedure.input((val: unknown) => val as { icsContent: string }).mutation(async ({ ctx, input }) => {
      const { parseICalendar, getBuildingLocation } = await import("./calendar");
      const { deleteUserCourses, insertCourse } = await import("./db");
      
      const parsedCourses = await parseICalendar(input.icsContent);
      
      // Delete existing courses
      await deleteUserCourses(ctx.user.id);
      
      // Insert new courses with location data
      for (const course of parsedCourses) {
        const location = course.location ? getBuildingLocation(course.location) : null;
        await insertCourse({
          userId: ctx.user.id,
          courseName: course.courseName,
          courseCode: course.courseCode,
          location: course.location,
          buildingName: course.buildingName || location?.name,
          roomNumber: course.roomNumber,
          latitude: location?.lat.toString(),
          longitude: location?.lng.toString(),
          startTime: course.startTime,
          endTime: course.endTime,
          recurrenceRule: course.recurrenceRule,
        });
      }
      
      return { success: true, count: parsedCourses.length };
    }),
  }),

  // Meal Management
  meals: router({
    list: protectedProcedure.input((val: unknown) => val as { startDate?: string; endDate?: string } | undefined).query(async ({ ctx, input }) => {
      const { getUserMeals } = await import("./db");
      const startDate = input?.startDate ? new Date(input.startDate) : undefined;
      const endDate = input?.endDate ? new Date(input.endDate) : undefined;
      return getUserMeals(ctx.user.id, startDate, endDate);
    }),
    log: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ ctx, input }) => {
      const { insertMeal } = await import("./db");
      await insertMeal({ userId: ctx.user.id, ...input });
      return { success: true };
    }),
    recommendations: protectedProcedure.input((val: unknown) => val as { context?: string } | undefined).query(async ({ ctx, input }) => {
      const { getWellnessProfile, getUserCourses } = await import("./db");
      const { fetchAllMensaMenus, filterDishes } = await import("./mensa");
      const { generateMealRecommendations } = await import("./gemini");
      
      const profile = await getWellnessProfile(ctx.user.id);
      const allCourses = await getUserCourses(ctx.user.id);
      const allDishes = await fetchAllMensaMenus(new Date());
      
      // Get today's courses
      const today = new Date();
      const todaysCourses = allCourses
        .filter(c => {
          const courseDate = new Date(c.startTime);
          return courseDate.toDateString() === today.toDateString();
        })
        .map(c => ({
          courseName: c.courseName,
          startTime: new Date(c.startTime),
          endTime: new Date(c.endTime),
          location: c.location || undefined,
        }));
      
      // Filter based on profile
      const filteredDishes = profile ? filterDishes(allDishes, {
        maxPrice: profile.budgetGoal || undefined,
        dietaryRestrictions: profile.dietaryRestrictions ? JSON.parse(profile.dietaryRestrictions) : undefined,
      }) : allDishes;
      
      // Get AI recommendations with course context
      const aiRecommendation = await generateMealRecommendations(
        {
          calorieGoal: profile?.dailyCalorieGoal || undefined,
          proteinGoal: profile?.proteinGoal || undefined,
          budgetGoal: profile?.budgetGoal || undefined,
          dietaryRestrictions: profile?.dietaryRestrictions ? JSON.parse(profile.dietaryRestrictions) : undefined,
          preferredCuisines: profile?.preferredCuisines ? JSON.parse(profile.preferredCuisines) : undefined,
        },
        filteredDishes.slice(0, 10).map(d => ({
          dishName: d.dishName,
          mensaName: d.mensaName,
          calories: d.calories || undefined,
          protein: d.protein || undefined,
          price: d.price,
          labels: d.labels ? JSON.parse(d.labels as any) : undefined,
        })),
        input?.context,
        todaysCourses
      );
      
      return { dishes: filteredDishes, aiRecommendation };
    }),
  }),

  // Commute Planning
  commutes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserCommutes } = await import("./db");
      return getUserCommutes(ctx.user.id);
    }),
    plan: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ ctx, input }) => {
      const { findJourneys } = await import("./db-transport");
      const { generateCommuteAdvice } = await import("./gemini");
      
      // Use DB Hafas API for real-time public transport routes
      const journeys = await findJourneys(
        { latitude: input.fromLat, longitude: input.fromLng },
        { latitude: input.toLat, longitude: input.toLng },
        {
          departure: input.departureTime ? new Date(input.departureTime) : new Date(),
          results: 3,
        }
      );
      
      const aiAdvice = await generateCommuteAdvice(
        { lat: input.fromLat, lng: input.fromLng, name: input.fromName },
        { lat: input.toLat, lng: input.toLng, name: input.toName },
        new Date(input.arrivalTime),
        input.userPace
      );
      
      return { routes: journeys, aiAdvice };
    }),
    log: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ ctx, input }) => {
      const { insertCommute } = await import("./db");
      await insertCommute({ userId: ctx.user.id, ...input });
      return { success: true };
    }),
  }),

  // Focus Mode Management
  focusMode: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const { getFocusMode } = await import("./db");
      let mode = await getFocusMode(ctx.user.id);
      if (!mode) {
        // Create default focus mode
        const { upsertFocusMode } = await import("./db");
        await upsertFocusMode(ctx.user.id, { currentMode: "balanced" });
        mode = await getFocusMode(ctx.user.id);
      }
      return mode;
    }),
    update: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ ctx, input }) => {
      const { upsertFocusMode } = await import("./db");
      await upsertFocusMode(ctx.user.id, input);
      return { success: true };
    }),
    optimize: protectedProcedure.input((val: unknown) => val as { mode: "study" | "health" | "balanced" | "exam" } | undefined).query(async ({ ctx, input }) => {
      const { getFocusMode } = await import("./db");
      const { getUserCourses, getUserMeals } = await import("./db");
      const { optimizeScheduleWithFocusMode } = await import("./gemini");
      
      const focusMode = await getFocusMode(ctx.user.id);
      const mode = input?.mode || focusMode?.currentMode || "balanced";
      
      const courses = await getUserCourses(ctx.user.id);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const meals = await getUserMeals(ctx.user.id, today, tomorrow);
      
      const optimization = await optimizeScheduleWithFocusMode(
        mode as any,
        {
          courses: courses.map(c => ({ name: c.courseName, startTime: new Date(c.startTime), endTime: new Date(c.endTime) })),
          meals: meals.map(m => ({ type: m.mealType, time: new Date(m.consumedAt) })),
          commutes: [],
        },
        {}
      );
      
      return { mode, optimization };
    }),
  }),

  // AI Chat
  chat: router({
    send: protectedProcedure.input((val: unknown) => val as { message: string; context?: any }).mutation(async ({ ctx, input }) => {
      const { getUserConversations, insertConversation, getWellnessProfile, getUserCourses, getFocusMode } = await import("./db");
      const { chatWithGemini } = await import("./gemini");
      
      // Get conversation history
      const history = await getUserConversations(ctx.user.id, 10);
      const geminiHistory = history.reverse().map(h => ({
        role: h.role === "user" ? "user" as const : "model" as const,
        parts: [{ text: h.content }],
      }));
      
      // Get user context for more personalized responses
      const [wellnessProfile, courses, focusMode] = await Promise.all([
        getWellnessProfile(ctx.user.id),
        getUserCourses(ctx.user.id),
        getFocusMode(ctx.user.id),
      ]);
      
      // Build user context string
      const now = new Date();
      const todaysCourses = courses.filter(c => {
        const courseDate = new Date(c.startTime);
        return courseDate.toDateString() === now.toDateString();
      });
      
      let userContext = `\n\n## Current User Context (${now.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} ${now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })})`;
      
      if (ctx.user.name) {
        userContext += `\n- User Name: ${ctx.user.name}`;
      }
      
      if (focusMode) {
        userContext += `\n- Current Focus Mode: ${focusMode.currentMode}`;
      }
      
      if (wellnessProfile) {
        userContext += `\n- Daily Calorie Goal: ${wellnessProfile.dailyCalorieGoal || 'Not set'}`;
        userContext += `\n- Budget Goal: ${wellnessProfile.budgetGoal ? `€${(wellnessProfile.budgetGoal / 100).toFixed(2)}` : 'Not set'}`;
        if (wellnessProfile.dietaryRestrictions) {
          try {
            const restrictions = JSON.parse(wellnessProfile.dietaryRestrictions);
            if (restrictions.length > 0) {
              userContext += `\n- Dietary Restrictions: ${restrictions.join(', ')}`;
            }
          } catch (e) {}
        }
      }
      
      if (todaysCourses.length > 0) {
        userContext += `\n- Today's Classes:`;
        todaysCourses.forEach(c => {
          const start = new Date(c.startTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
          const end = new Date(c.endTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
          userContext += `\n  - ${c.courseName}: ${start}-${end}${c.location ? ` at ${c.location}` : ''}`;
        });
      } else {
        userContext += `\n- No classes scheduled for today`;
      }
      
      // Save user message
      await insertConversation({
        userId: ctx.user.id,
        role: "user",
        content: input.message,
        context: input.context ? JSON.stringify(input.context) : null,
      });
      
      // Get AI response with enhanced system prompt
      const systemPrompt = `You are an intelligent AI life coach specifically designed for TUM (Technical University of Munich) students. Your name is "TUM Life Assistant".

## Your Core Capabilities:
1. **Meal Planning**: Recommend dishes from TUM Mensas (canteens) based on nutritional goals, budget, dietary restrictions, and schedule
2. **Commute Optimization**: Help plan routes using Munich's MVV public transport system, considering class schedules and walking times
3. **Time Management**: Optimize daily schedules balancing study, health, and social activities
4. **Academic Support**: Provide study tips, exam preparation strategies, and productivity advice

## Your Personality:
- Friendly, supportive, and encouraging
- Practical and action-oriented - always give specific, actionable advice
- Proactive - anticipate needs and offer suggestions
- Culturally aware of German university life and Munich

## Response Guidelines:
- Keep responses concise but comprehensive (2-4 paragraphs max unless detailed info requested)
- Use bullet points for lists and recommendations
- Include specific numbers, times, or locations when relevant
- Ask clarifying questions when needed to give better advice
- Reference Munich-specific information (MVV lines, TUM buildings, local Mensas)
- Be encouraging about student challenges like exam stress or time management

## Context Awareness:
- Remember previous conversation context
- Connect different aspects of student life (e.g., suggest quick meals before exams)
- Consider time of day, day of week, and semester period in recommendations

Always respond in the same language the user uses. If they write in German, respond in German. If in English, respond in English.` + userContext;
      const response = await chatWithGemini(systemPrompt, input.message, geminiHistory);
      
      // Save assistant response
      await insertConversation({
        userId: ctx.user.id,
        role: "assistant",
        content: response,
      });
      
      return { response };
    }),
    history: protectedProcedure.query(async ({ ctx }) => {
      const { getUserConversations } = await import("./db");
      const conversations = await getUserConversations(ctx.user.id, 50);
      // Reverse to show oldest first (chronological order)
      return conversations.reverse();
    }),
  }),

  // Mensa Data
  mensa: router({
    dishes: protectedProcedure.input((val: unknown) => val as { date?: string } | undefined).query(async ({ ctx, input }) => {
      const { fetchAllMensaMenus } = await import("./mensa");
      const date = input?.date ? new Date(input.date) : new Date();
      return fetchAllMensaMenus(date);
    }),
    locations: publicProcedure.query(async () => {
      const { TUM_MENSAS } = await import("./mensa");
      return TUM_MENSAS;
    }),
    // Get today's menu from OpenMensa (Heilbronn)
    getTodayMenu: publicProcedure.query(async () => {
      const { getTodayMenu } = await import("./openmensa");
      try {
        const meals = await getTodayMenu();
        return { success: true, meals };
      } catch (error) {
        console.error("Error fetching today's menu:", error);
        return { success: false, meals: [], error: String(error) };
      }
    }),
    // Get menu for a specific date from OpenMensa
    getMenuByDate: publicProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ input }) => {
        const { getHeilbronnMenu } = await import("./openmensa");
        try {
          const meals = await getHeilbronnMenu(input.date);
          return { success: true, meals };
        } catch (error) {
          console.error(`Error fetching menu for ${input.date}:`, error);
          return { success: false, meals: [], error: String(error) };
        }
      }),
    // Get AI-powered portion recommendations
    getPortionRecommendations: protectedProcedure
      .input(z.object({
        todayHistory: z.object({
          caloriesConsumed: z.number(),
          proteinConsumed: z.number(),
          budgetSpent: z.number(),
        }).optional(),
      }))
      .query(async ({ ctx, input }) => {
        const { getTodayMenu } = await import("./openmensa");
        const { generatePortionRecommendations } = await import("./portionRecommendation");
        const { getWellnessProfile } = await import("./db");
        
        try {
          const meals = await getTodayMenu();
          const profile = await getWellnessProfile(ctx.user.id);
          
          const recommendations = await generatePortionRecommendations(
            {
              dailyCalorieGoal: profile?.dailyCalorieGoal,
              proteinGoal: profile?.proteinGoal,
              budgetGoal: profile?.budgetGoal,
              dietaryRestrictions: profile?.dietaryRestrictions,
              preferredCuisines: profile?.preferredCuisines,
            },
            meals,
            input.todayHistory
          );
          
          return { success: true, ...recommendations };
        } catch (error) {
          console.error("Error generating portion recommendations:", error);
          return { success: false, error: String(error) };
        }
      }),
  }),

  // TUM Account Binding
  tumAccount: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const { getTumAccountByUserId } = await import("./db");
      return getTumAccountByUserId(ctx.user.id);
    }),
    requestVerification: protectedProcedure
      .input(
        z.object({
          tumEmail: z.string().email(),
          studentId: z.string().min(1),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          faculty: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { getTumAccountByUserId, getTumAccountByEmail, createTumAccount, updateTumAccount } = await import("./db");
        const { isValidTumEmail, generateVerificationCode, sendVerificationEmail, getVerificationExpiry } = await import("./emailVerification");

        if (!isValidTumEmail(input.tumEmail)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid TUM email. Please use @tum.de or @mytum.de email." });
        }

        const existingAccount = await getTumAccountByEmail(input.tumEmail);
        if (existingAccount && existingAccount.userId !== ctx.user.id) {
          throw new TRPCError({ code: "CONFLICT", message: "This TUM email is already linked to another account." });
        }

        const code = generateVerificationCode();
        const expiry = getVerificationExpiry();
        const userAccount = await getTumAccountByUserId(ctx.user.id);

        if (userAccount) {
          await updateTumAccount(ctx.user.id, {
            tumEmail: input.tumEmail,
            studentId: input.studentId,
            firstName: input.firstName,
            lastName: input.lastName,
            faculty: input.faculty,
            verificationCode: code,
            verificationExpiry: expiry,
            isVerified: 0,
          });
        } else {
          await createTumAccount({
            userId: ctx.user.id,
            tumEmail: input.tumEmail,
            studentId: input.studentId,
            firstName: input.firstName,
            lastName: input.lastName,
            faculty: input.faculty,
            verificationCode: code,
            verificationExpiry: expiry,
            isVerified: 0,
          });
        }

        const emailSent = await sendVerificationEmail(input.tumEmail, code, input.firstName || ctx.user.name || undefined);
        if (!emailSent) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to send verification email. Please try again." });
        }

        return { success: true, message: "Verification code sent to your TUM email." };
      }),
    verify: protectedProcedure
      .input(z.object({ code: z.string().length(6) }))
      .mutation(async ({ ctx, input }) => {
        const { getTumAccountByUserId, updateTumAccount } = await import("./db");
        const { isVerificationExpired } = await import("./emailVerification");

        const account = await getTumAccountByUserId(ctx.user.id);
        if (!account) {
          throw new TRPCError({ code: "NOT_FOUND", message: "No TUM account found. Please request verification first." });
        }
        if (account.isVerified === 1) {
          return { success: true, message: "Your TUM account is already verified." };
        }
        if (isVerificationExpired(account.verificationExpiry)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Verification code has expired. Please request a new one." });
        }
        if (account.verificationCode !== input.code) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid verification code." });
        }

        await updateTumAccount(ctx.user.id, { isVerified: 1, verificationCode: null, verificationExpiry: null });
        return { success: true, message: "TUM account verified successfully!" };
      }),
  }),
});

export type AppRouter = typeof appRouter;
