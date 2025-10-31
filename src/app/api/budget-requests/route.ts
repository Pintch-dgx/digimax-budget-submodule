import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { BudgetRequestStatus } from "@prisma/client";

// GET /api/budget-requests - Lista tutte le richieste budget
export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/budget-requests - Starting");
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    
    // Log cookies for debugging
    const cookies = request.cookies.getAll();
    console.log("Cookies received:", cookies.length, "cookies");
    const authCookie = cookies.find(c => c.name.startsWith("authjs.session-token") || c.name.startsWith("__Secure-authjs.session-token") || c.name.includes("session"));
    console.log("Auth cookie found:", authCookie ? `${authCookie.name} (${authCookie.value.length} chars)` : "No auth cookie");
    
    // Log headers
    const authHeader = request.headers.get("authorization");
    const cookieHeader = request.headers.get("cookie");
    console.log("Authorization header:", authHeader ? "Present" : "Missing");
    console.log("Cookie header:", cookieHeader ? `${cookieHeader.length} chars` : "Missing");
    
    let session;
    try {
      session = await getSession();
      console.log("Session retrieved:", session ? "Yes" : "No");
      if (session) {
        console.log("Session user:", session.user ? session.user.email : "No user");
        console.log("Session user ID:", session.user?.id || "No ID");
      } else {
        console.log("⚠️ No session found - user is not authenticated");
        console.log("This could mean:");
        console.log("  - Cookie is missing or invalid");
        console.log("  - Session expired");
        console.log("  - User never logged in");
      }
    } catch (authError) {
      console.error("❌ Auth error:", authError);
      console.error("Auth error name:", authError instanceof Error ? authError.name : typeof authError);
      console.error("Auth error constructor:", authError instanceof Error ? authError.constructor.name : "N/A");
      console.error("Auth error stack:", authError instanceof Error ? authError.stack : "N/A");
      return NextResponse.json({ error: "Authentication failed", details: String(authError) }, { status: 401 });
    }
    
    if (!session) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 });
    }
    
    if (!session.user || !session.user.id) {
      console.log("Session exists but no user or user ID");
      return NextResponse.json({ error: "Unauthorized - No user ID" }, { status: 401 });
    }
    
    console.log("Querying database...");

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const fiscalYearId = searchParams.get("fiscalYearId");

    const where: any = {};
    if (status) {
      where.status = status as BudgetRequestStatus;
    }
    if (fiscalYearId) {
      where.fiscalYearId = parseInt(fiscalYearId);
    }

    const requests = await prisma.budgetRequest.findMany({
      where,
      include: {
        requester: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        fiscalYear: {
          select: {
            id: true,
            code: true,
            label: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("Database query successful, found", requests.length, "requests");
    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching budget requests:");
    console.error("Error name:", error instanceof Error ? error.name : typeof error);
    console.error("Error constructor:", error instanceof Error ? error.constructor.name : "N/A");
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Full error:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : "UnknownError";
    
    // Se è un errore Prisma, potrebbe essere il database
    if (errorMessage.includes("Unable to open the database file") || errorMessage.includes("database")) {
      return NextResponse.json(
        { error: "Database error", details: "Impossibile connettersi al database. Verifica che il database sia inizializzato.", errorName },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch budget requests", details: errorMessage, errorName },
      { status: 500 }
    );
  }
}

// POST /api/budget-requests - Crea nuova richiesta budget
export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/budget-requests - Starting");
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    
    // Log cookies for debugging
    const cookies = request.cookies.getAll();
    console.log("Cookies received:", cookies.length, "cookies");
    const authCookie = cookies.find(c => c.name.startsWith("authjs.session-token") || c.name.startsWith("__Secure-authjs.session-token") || c.name.includes("session"));
    console.log("Auth cookie found:", authCookie ? `${authCookie.name} (${authCookie.value.length} chars)` : "No auth cookie");
    
    // Log headers
    const authHeader = request.headers.get("authorization");
    const cookieHeader = request.headers.get("cookie");
    console.log("Authorization header:", authHeader ? "Present" : "Missing");
    console.log("Cookie header:", cookieHeader ? `${cookieHeader.length} chars` : "Missing");
    
    let session;
    try {
      session = await getSession();
      console.log("Session retrieved:", session ? "Yes" : "No");
      if (session) {
        console.log("Session user:", session.user ? session.user.email : "No user");
        console.log("Session user ID:", session.user?.id || "No ID");
      } else {
        console.log("⚠️ No session found - user is not authenticated");
        console.log("This could mean:");
        console.log("  - Cookie is missing or invalid");
        console.log("  - Session expired");
        console.log("  - User never logged in");
      }
    } catch (authError) {
      console.error("❌ Auth error:", authError);
      console.error("Auth error name:", authError instanceof Error ? authError.name : typeof authError);
      console.error("Auth error constructor:", authError instanceof Error ? authError.constructor.name : "N/A");
      console.error("Auth error stack:", authError instanceof Error ? authError.stack : "N/A");
      return NextResponse.json({ error: "Authentication failed", details: String(authError) }, { status: 401 });
    }
    
    if (!session) {
      console.log("❌ No session found - returning 401");
      console.log("Available cookies:", cookies.map(c => ({ name: c.name, hasValue: !!c.value })));
      return NextResponse.json(
        { 
          error: "Unauthorized - No session",
          details: "La sessione non è stata trovata. Verifica di essere autenticato e che i cookie vengano inviati correttamente.",
          debug: {
            cookieCount: cookies.length,
            hasAuthCookie: !!authCookie,
            cookieHeaderPresent: !!cookieHeader,
          }
        }, 
        { status: 401 }
      );
    }
    
    if (!session.user || !session.user.id) {
      console.log("❌ Session exists but no user or user ID");
      return NextResponse.json(
        { 
          error: "Unauthorized - No user ID",
          details: "La sessione esiste ma non contiene informazioni utente valide.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("Request body:", { ...body, notes: body.notes ? "present" : "null" });
    
    const { title, amount, dueDate, notes, fiscalYearId } = body;

    // Validazione
    if (!title || !amount || !dueDate) {
      console.log("Validation failed:", { hasTitle: !!title, hasAmount: !!amount, hasDueDate: !!dueDate });
      return NextResponse.json(
        { error: "Title, amount, and dueDate are required" },
        { status: 400 }
      );
    }

    // Validazione amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      console.log("Invalid amount:", amount);
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    // Trova o usa il fiscal year corrente
    let fyId = fiscalYearId;
    if (!fyId) {
      console.log("No fiscalYearId provided, searching for default fiscal year");
      let currentFY = await prisma.fiscalYear.findFirst({
        orderBy: { createdAt: "desc" },
      });
      
      // Se non esiste un fiscal year, creane uno di default per l'anno corrente
      if (!currentFY) {
        const currentYear = new Date().getFullYear();
        const fiscalYearCode = `FY${currentYear}`;
        console.log(`No fiscal year found, creating default: ${fiscalYearCode}`);
        
        try {
          currentFY = await prisma.fiscalYear.create({
            data: {
              code: fiscalYearCode,
              label: `Fiscal Year ${currentYear}`,
              totalBudget: 1_000_000, // Budget di default
              currency: "EUR",
            },
          });
          console.log(`Created fiscal year: ${currentFY.code} (ID: ${currentFY.id})`);
        } catch (fyError) {
          console.error("Error creating fiscal year:", fyError);
          return NextResponse.json(
            { error: "Failed to create fiscal year", details: fyError instanceof Error ? fyError.message : String(fyError) },
            { status: 500 }
          );
        }
      } else {
        console.log(`Using existing fiscal year: ${currentFY.code} (ID: ${currentFY.id})`);
      }
      fyId = currentFY.id;
    } else {
      // Valida che il fiscalYearId esista
      console.log(`Validating fiscalYearId: ${fyId}`);
      const fiscalYearExists = await prisma.fiscalYear.findUnique({
        where: { id: parseInt(fyId.toString()) },
      });
      if (!fiscalYearExists) {
        return NextResponse.json(
          { error: "Invalid fiscal year ID" },
          { status: 400 }
        );
      }
      fyId = parseInt(fyId.toString());
    }

    // Validazione requesterId
    let requesterId: number;
    
    // Prova prima con l'ID dalla sessione
    const sessionUserId = parseInt(session.user.id);
    if (!isNaN(sessionUserId)) {
      requesterId = sessionUserId;
      console.log(`Using requesterId from session: ${requesterId}`);
    } else {
      // Se l'ID non è valido, prova a trovare l'utente per email
      console.log(`Invalid session user ID: ${session.user.id}, trying to find user by email: ${session.user.email}`);
      if (!session.user.email) {
        console.error("No email in session, cannot find user");
        return NextResponse.json(
          { error: "Invalid user session - no email or ID" },
          { status: 400 }
        );
      }
      
      const userByEmail = await prisma.marketingUser.findUnique({
        where: { email: session.user.email },
      });
      
      if (!userByEmail) {
        console.error("User not found by email:", session.user.email);
        return NextResponse.json(
          { error: "User not found in database" },
          { status: 404 }
        );
      }
      
      requesterId = userByEmail.id;
      console.log(`Found user by email, using ID: ${requesterId}`);
    }

    // Verifica che l'utente esista nel database (doppio controllo)
    const requesterExists = await prisma.marketingUser.findUnique({
      where: { id: requesterId },
      select: { id: true, email: true, fullName: true },
    });
    
    if (!requesterExists) {
      console.error("❌ Requester not found in database with ID:", requesterId);
      console.error("Session user ID was:", session.user.id);
      console.error("Session user email was:", session.user.email);
      
      // Prova a cercare tutti gli utenti per debug
      const allUsers = await prisma.marketingUser.findMany({
        select: { id: true, email: true, fullName: true },
        take: 10,
      });
      console.error("Available users in database:", allUsers);
      
      return NextResponse.json(
        { error: "User not found in database. Session ID mismatch.", details: `Session ID: ${session.user.id}, Tried ID: ${requesterId}` },
        { status: 404 }
      );
    }
    
    console.log(`✅ Requester verified: ${requesterExists.fullName} (${requesterExists.email}, ID: ${requesterExists.id})`);

    console.log("Creating budget request with data:", {
      title,
      amount: amountNum,
      dueDate: new Date(dueDate),
      fiscalYearId: fyId,
      requesterId,
    });

    const budgetRequest = await prisma.budgetRequest.create({
      data: {
        title,
        amount: Math.round(amountNum), // Arrotonda a intero
        dueDate: new Date(dueDate),
        notes: notes || null,
        fiscalYearId: fyId,
        requesterId: requesterId,
        status: BudgetRequestStatus.PENDING_APPROVAL,
      },
      include: {
        requester: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        fiscalYear: {
          select: {
            id: true,
            code: true,
            label: true,
          },
        },
      },
    });

    console.log("Budget request created successfully:", budgetRequest.id);
    return NextResponse.json(budgetRequest, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating budget request:");
    console.error("Error name:", error instanceof Error ? error.name : typeof error);
    console.error("Error constructor:", error instanceof Error ? error.constructor.name : "N/A");
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "N/A");
    
    // Errori Prisma specifici
    if (error instanceof Error) {
      // Violazione constraint unico
      if (error.message.includes("Unique constraint") || error.message.includes("UNIQUE constraint")) {
        return NextResponse.json(
          { error: "Una richiesta simile esiste già", details: error.message },
          { status: 409 }
        );
      }
      
      // Foreign key constraint
      if (error.message.includes("Foreign key constraint") || error.message.includes("relation")) {
        return NextResponse.json(
          { error: "Riferimento non valido (fiscal year o utente non esistenti)", details: error.message },
          { status: 400 }
        );
      }
      
      // Fiscal year specifico
      if (error.message.includes("fiscalYear")) {
        return NextResponse.json(
          { error: "Fiscal year non valido o non trovato", details: error.message },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Failed to create budget request", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

