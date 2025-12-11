import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import axios from "axios";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerGitHubOAuthRoutes(app: Express) {
  // GitHub OAuth callback
  app.get("/api/auth/callback/github", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code) {
      res.status(400).json({ error: "code is required" });
      return;
    }

    try {
      // Exchange code for access token
      const tokenResponse = await axios.post<GitHubTokenResponse>(
        "https://github.com/login/oauth/access_token",
        {
          client_id: ENV.githubClientId,
          client_secret: ENV.githubClientSecret,
          code,
        },
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      const accessToken = tokenResponse.data.access_token;

      // Get user info from GitHub
      const userResponse = await axios.get<GitHubUser>(
        "https://api.github.com/user",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );

      const githubUser = userResponse.data;

      // If email is null, try to get primary email
      let email = githubUser.email;
      if (!email) {
        try {
          const emailsResponse = await axios.get<Array<{ email: string; primary: boolean; verified: boolean }>>(
            "https://api.github.com/user/emails",
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/json",
              },
            }
          );
          const primaryEmail = emailsResponse.data.find(e => e.primary && e.verified);
          if (primaryEmail) {
            email = primaryEmail.email;
          }
        } catch (error) {
          console.warn("[GitHub OAuth] Failed to fetch user emails", error);
        }
      }

      // Create openId from GitHub user ID
      const openId = `github_${githubUser.id}`;

      // Upsert user in database
      await db.upsertUser({
        openId,
        name: githubUser.name || githubUser.login,
        email: email || null,
        loginMethod: "github",
        lastSignedIn: new Date(),
      });

      // Create session token
      const sessionToken = await sdk.createSessionToken(openId, {
        name: githubUser.name || githubUser.login,
        expiresInMs: ONE_YEAR_MS,
      });

      // Set cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to home or state URL
      const redirectUrl = state ? decodeURIComponent(state) : "/";
      res.redirect(302, redirectUrl);
    } catch (error) {
      console.error("[GitHub OAuth] Callback failed", error);
      res.status(500).json({ error: "GitHub OAuth callback failed" });
    }
  });
}
