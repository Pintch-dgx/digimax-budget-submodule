
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { BudgetRequestLinkStatus, BudgetRequestStatus, Prisma } from "@prisma/client";

// GET /api/budget-requests - Lista tutte le richieste budget
export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/budget-requests - Starting");

    const session = await getSession();

    if (!session || !session.user || !session.user.id) {
      console.log("GET /api/budget-requests - Unauthorized");
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const fiscalYearId = searchParams.get("fiscalYearId");
    const requesterId = searchParams.get("requesterId");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const pageSizeParam = parseInt(searchParams.get("pageSize") || "10", 10);
    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    const pageSize = Number.isNaN(pageSizeParam)
      ? 10
      : Math.min(Math.max(pageSizeParam, 5), 50);

    const where: Prisma.BudgetRequestWhereInput = {};

    if (status && status !== "all") {
      where.status = status as BudgetRequestStatus;
    }

    if (fiscalYearId) {
      const fiscalYear = parseInt(fiscalYearId, 10);
      if (!Number.isNaN(fiscalYear)) {
        where.fiscalYearId = fiscalYear;
      }
    }

    if (requesterId) {
      const requester = parseInt(requesterId, 10);
      if (!Number.isNaN(requester)) {
        where.requesterId = requester;
      }
    }

    if (search) {
      const searchConditions: Prisma.BudgetRequestWhereInput[] = [
        { title: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
        { requester: { fullName: { contains: search, mode: "insensitive" } } },
        { requester: { email: { contains: search, mode: "insensitive" } } },
        { fiscalYear: { code: { contains: search, mode: "insensitive" } } },
      ];
      where.OR = searchConditions;
    }

    const dueDateFilter: Prisma.DateTimeFilter = {};
    if (startDate) {
      const start = new Date(startDate);
      if (!Number.isNaN(start.getTime())) {
        dueDateFilter.gte = start;
      }
    }
    if (endDate) {
      const end = new Date(endDate);
      if (!Number.isNaN(end.getTime())) {
        // Imposta fine giornata per includere l'intero giorno di fine intervallo
        end.setHours(23, 59, 59, 999);
        dueDateFilter.lte = end;
      }
    }
    if (Object.keys(dueDateFilter).length > 0) {
      where.dueDate = dueDateFilter;
    }

    const skip = (page - 1) * pageSize;

    const currentUserId = Number.parseInt(String(session.user.id), 10);
    const currentUser = Number.isNaN(currentUserId)
      ? null
      : await prisma.marketingUser.findUnique({
          where: { id: currentUserId },
          include: { role: true },
        });

    const canDelete = (currentUser?.role?.key ?? "").toLowerCase() === "admin";

    const [total, requests] = await Promise.all([
      prisma.budgetRequest.count({ where }),
      prisma.budgetRequest.findMany({
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
          campaign: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    console.log(
      "GET /api/budget-requests - Success",
      JSON.stringify({
        filters: { status, fiscalYearId, requesterId, search, startDate, endDate },
        pagination: { page, pageSize, total, totalPages },
        canDelete,
      })
    );

    return NextResponse.json({
      data: requests,
      meta: {
        total,
        page,
        pageSize,
        totalPages,
        canDelete,
      },
    });
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
    
    const { title, amount, dueDate, notes, fiscalYearId, quarterSprintId, keyResultId, campaignId } = body;

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

    let resolvedQuarterSprintId: number | null = null;
    if (quarterSprintId !== undefined && quarterSprintId !== null && quarterSprintId !== "") {
      const parsedQuarterId = Number(quarterSprintId);
      if (!Number.isFinite(parsedQuarterId)) {
        return NextResponse.json({ error: "Quarter sprint non valido" }, { status: 400 });
      }

      const quarterSprint = await (prisma as any).quarterSprint.findUnique({
        where: { id: parsedQuarterId },
        select: { id: true, fiscalYearId: true },
      });

      if (!quarterSprint) {
        return NextResponse.json({ error: "Quarter sprint non trovato" }, { status: 404 });
      }

      resolvedQuarterSprintId = quarterSprint.id;
      if (!fyId && quarterSprint.fiscalYearId) {
        fyId = quarterSprint.fiscalYearId;
      }
    }

    let resolvedKeyResultId: number | null = null;
    if (keyResultId !== undefined && keyResultId !== null && keyResultId !== "") {
      const parsedKeyResultId = Number(keyResultId);
      if (!Number.isFinite(parsedKeyResultId)) {
        return NextResponse.json({ error: "Key Result non valido" }, { status: 400 });
      }

      const keyResult = await (prisma as any).keyResult.findUnique({
        where: { id: parsedKeyResultId },
        select: { id: true, quarterSprintId: true },
      });

      if (!keyResult) {
        return NextResponse.json({ error: "Key Result non trovato" }, { status: 404 });
      }

      resolvedKeyResultId = keyResult.id;

      if (keyResult.quarterSprintId) {
        if (resolvedQuarterSprintId && resolvedQuarterSprintId !== keyResult.quarterSprintId) {
          return NextResponse.json(
            { error: "Il Key Result selezionato appartiene a un Quarter Sprint diverso" },
            { status: 400 }
          );
        }
        resolvedQuarterSprintId = keyResult.quarterSprintId;
      }
    }

    let resolvedCampaignId: number | null = null;
    if (campaignId !== undefined && campaignId !== null && campaignId !== "") {
      const parsedCampaignId = Number(campaignId);
      if (!Number.isFinite(parsedCampaignId)) {
        return NextResponse.json({ error: "Campagna non valida" }, { status: 400 });
      }

      const campaign = await prisma.campaign.findUnique({
        where: { id: parsedCampaignId },
        select: {
          id: true,
          fiscalYearId: true,
          quarterSprintId: true,
          keyResultId: true,
        },
      });

      if (!campaign) {
        return NextResponse.json({ error: "Campagna non trovata" }, { status: 404 });
      }

      if (campaign.fiscalYearId !== fyId) {
        return NextResponse.json(
          { error: "La campagna selezionata appartiene a un anno fiscale diverso" },
          { status: 400 }
        );
      }

      if (campaign.quarterSprintId) {
        if (resolvedQuarterSprintId && resolvedQuarterSprintId !== campaign.quarterSprintId) {
          return NextResponse.json(
            { error: "La campagna selezionata appartiene a un Quarter Sprint diverso" },
            { status: 400 }
          );
        }
        resolvedQuarterSprintId = campaign.quarterSprintId;
      }

      if (campaign.keyResultId) {
        if (resolvedKeyResultId && resolvedKeyResultId !== campaign.keyResultId) {
          return NextResponse.json(
            { error: "La campagna selezionata è legata a un Key Result diverso" },
            { status: 400 }
          );
        }
        resolvedKeyResultId = campaign.keyResultId;
      }

      resolvedCampaignId = campaign.id;
    }

    const linkStatus = resolvedCampaignId
      ? BudgetRequestLinkStatus.ASSIGNED_TO_CAMPAIGN
      : resolvedKeyResultId
        ? BudgetRequestLinkStatus.ASSIGNMENT_PENDING
        : BudgetRequestLinkStatus.UNDEFINED_OBJECTIVE;

    console.log("Creating budget request with data:", {
      title,
      amount: amountNum,
      dueDate: new Date(dueDate),
      fiscalYearId: fyId,
      requesterId,
      quarterSprintId: resolvedQuarterSprintId,
      keyResultId: resolvedKeyResultId,
      campaignId: resolvedCampaignId,
      linkStatus,
    });

    const createData = {
      title,
      amount: Math.round(amountNum),
      dueDate: new Date(dueDate),
      notes: notes || null,
      fiscalYear: { connect: { id: fyId } },
      requester: { connect: { id: requesterId } },
      status: BudgetRequestStatus.PENDING_APPROVAL,
      linkStatus,
      ...(resolvedQuarterSprintId
        ? {
            quarterSprint: {
              connect: { id: resolvedQuarterSprintId },
            },
          }
        : {}),
      ...(resolvedKeyResultId
        ? {
            keyResult: {
              connect: { id: resolvedKeyResultId },
            },
          }
        : {}),
      ...(resolvedCampaignId
        ? {
            campaign: {
              connect: { id: resolvedCampaignId },
            },
          }
        : {}),
    } satisfies Prisma.BudgetRequestCreateInput;

    const includeRelations = {
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
      quarterSprint: {
        select: {
          id: true,
          name: true,
          code: true,
          shortCode: true,
        },
      },
      keyResult: {
        select: {
          id: true,
          title: true,
          metric: true,
        },
      },
      campaign: {
        select: {
          id: true,
          name: true,
        },
      },
    } as const;

    const budgetRequest = await prisma.budgetRequest.create({
      data: createData,
      include: includeRelations,
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
