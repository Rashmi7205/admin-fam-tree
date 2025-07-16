import { auth } from "firebase-admin"
import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app"
import type { DecodedIdToken } from "firebase-admin/auth"
import { type NextRequest, NextResponse } from "next/server"

if (!getApps().length) {
  const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")!,
  }

  initializeApp({
    credential: cert(serviceAccount),
  })
}

export async function verifyToken(token: string): Promise<DecodedIdToken> {
  try {
    const decodedToken = await auth().verifyIdToken(token)
    return decodedToken
  } catch (error) {
    throw new Error("Invalid token")
  }
}

export type UserRole = "user" | "moderator" | "admin" | "super_admin"

export interface AuthenticatedRequest extends NextRequest {
  user?: DecodedIdToken & { role?: UserRole }
}

export function checkRole(requiredRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: NextResponse, next: () => void) => {
    const userRole: UserRole = req.user?.role || "user"
    if (!requiredRoles.includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }
    next()
  }
}
