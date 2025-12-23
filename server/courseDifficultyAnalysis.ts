/**
 * Course Difficulty Analysis Module
 * Uses AI to analyze course difficulty based on course name, code, and context
 */

import { chatWithGemini } from "./gemini";

export interface CourseDifficulty {
  courseCode: string;
  courseName: string;
  difficultyLevel: 1 | 2 | 3 | 4 | 5; // 1=Very Easy, 5=Very Hard
  estimatedStudyHours: number; // Per week
  cognitiveLoad: "Low" | "Medium" | "High" | "Very High";
  reasoning: string;
  recommendations: {
    studyMode: string;
    healthMode: string;
    balancedMode: string;
    examMode: string;
  };
}

/**
 * Analyze course difficulty using AI
 */
export async function analyzeCourse Difficulty(
  courseCode: string,
  courseName: string
): Promise<CourseDifficulty> {
  const prompt = `Analyze the difficulty of this university course:

**Course Code**: ${courseCode}
**Course Name**: ${courseName}

Please provide:
1. **Difficulty Level** (1-5 scale):
   - 1: Very Easy (introductory, minimal prerequisites)
   - 2: Easy (basic concepts, moderate workload)
   - 3: Medium (standard university course)
   - 4: Hard (advanced topics, heavy workload)
   - 5: Very Hard (graduate-level, extremely demanding)

2. **Estimated Study Hours** per week (outside of class)

3. **Cognitive Load**: Low / Medium / High / Very High

4. **Reasoning**: Brief explanation of difficulty assessment

5. **Mode-Specific Recommendations**:
   - Study Mode: How to maximize efficiency
   - Health Mode: How to avoid burnout
   - Balanced Mode: Sustainable study approach
   - Exam Mode: Intensive preparation strategy

Respond in JSON format:
{
  "difficultyLevel": number,
  "estimatedStudyHours": number,
  "cognitiveLoad": string,
  "reasoning": string,
  "recommendations": {
    "studyMode": string,
    "healthMode": string,
    "balancedMode": string,
    "examMode": string
  }
}`;

  try {
    const response = await chatWithGemini([
      {
        role: "user",
        content: prompt,
      },
    ]);

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return {
      courseCode,
      courseName,
      difficultyLevel: analysis.difficultyLevel,
      estimatedStudyHours: analysis.estimatedStudyHours,
      cognitiveLoad: analysis.cognitiveLoad,
      reasoning: analysis.reasoning,
      recommendations: analysis.recommendations,
    };
  } catch (error) {
    console.error("[CourseDifficulty] Analysis failed:", error);
    
    // Fallback to heuristic analysis
    return heuristicDifficultyAnalysis(courseCode, courseName);
  }
}

/**
 * Heuristic-based difficulty analysis (fallback)
 */
function heuristicDifficultyAnalysis(
  courseCode: string,
  courseName: string
): CourseDifficulty {
  let difficultyLevel: 1 | 2 | 3 | 4 | 5 = 3;
  let cognitiveLoad: "Low" | "Medium" | "High" | "Very High" = "Medium";
  let estimatedStudyHours = 6;

  const name = courseName.toLowerCase();
  const code = courseCode.toUpperCase();

  // Check for advanced indicators
  if (
    name.includes("advanced") ||
    name.includes("graduate") ||
    name.includes("research") ||
    code.match(/[A-Z]{2}[5-9]\d{3}/) // High-level course codes
  ) {
    difficultyLevel = 5;
    cognitiveLoad = "Very High";
    estimatedStudyHours = 12;
  }
  // Check for hard subjects
  else if (
    name.includes("algorithm") ||
    name.includes("theory") ||
    name.includes("quantum") ||
    name.includes("compiler") ||
    name.includes("cryptography")
  ) {
    difficultyLevel = 4;
    cognitiveLoad = "High";
    estimatedStudyHours = 10;
  }
  // Check for introductory courses
  else if (
    name.includes("introduction") ||
    name.includes("basic") ||
    name.includes("fundamentals") ||
    code.match(/[A-Z]{2}[1-2]\d{3}/) // Low-level course codes
  ) {
    difficultyLevel = 2;
    cognitiveLoad = "Low";
    estimatedStudyHours = 4;
  }

  return {
    courseCode,
    courseName,
    difficultyLevel,
    estimatedStudyHours,
    cognitiveLoad,
    reasoning: `Heuristic analysis based on course name and code patterns.`,
    recommendations: {
      studyMode: `Allocate ${estimatedStudyHours} hours/week. Focus on deep understanding.`,
      healthMode: `Limit to ${Math.max(4, estimatedStudyHours - 2)} hours/week to avoid burnout.`,
      balancedMode: `Aim for ${estimatedStudyHours} hours/week with regular breaks.`,
      examMode: `Intensive ${estimatedStudyHours + 4} hours/week in final 2 weeks.`,
    },
  };
}

/**
 * Batch analyze multiple courses
 */
export async function batchAnalyzeCourses(
  courses: Array<{ courseCode: string; courseName: string }>
): Promise<CourseDifficulty[]> {
  const results: CourseDifficulty[] = [];

  for (const course of courses) {
    try {
      const analysis = await analyzeCourseDifficulty(
        course.courseCode || "UNKNOWN",
        course.courseName
      );
      results.push(analysis);
    } catch (error) {
      console.error(`[CourseDifficulty] Failed to analyze ${course.courseName}:`, error);
    }
  }

  return results;
}

/**
 * Get total weekly study load
 */
export function calculateTotalStudyLoad(difficulties: CourseDifficulty[]): {
  totalHours: number;
  averageDifficulty: number;
  overallCognitiveLoad: string;
  warning?: string;
} {
  const totalHours = difficulties.reduce((sum, d) => sum + d.estimatedStudyHours, 0);
  const averageDifficulty =
    difficulties.reduce((sum, d) => sum + d.difficultyLevel, 0) / difficulties.length;

  let overallCognitiveLoad = "Medium";
  let warning: string | undefined;

  if (totalHours > 40) {
    overallCognitiveLoad = "Very High";
    warning = "⚠️ Total study load exceeds 40 hours/week. High burnout risk!";
  } else if (totalHours > 30) {
    overallCognitiveLoad = "High";
    warning = "⚠️ Heavy study load. Ensure adequate rest and breaks.";
  } else if (totalHours > 20) {
    overallCognitiveLoad = "Medium";
  } else {
    overallCognitiveLoad = "Low";
  }

  return {
    totalHours,
    averageDifficulty,
    overallCognitiveLoad,
    warning,
  };
}
