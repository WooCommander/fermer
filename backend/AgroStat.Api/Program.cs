using AgroStat.Api;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<InMemoryAgroStatStore>();
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
    .AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
app.UseCors();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));
app.MapGet("/api/farms", (InMemoryAgroStatStore store, string? search) =>
    Results.Ok(store.FindFarms(search)));
app.MapGet("/api/farms/{farmId:guid}", (Guid farmId, InMemoryAgroStatStore store) =>
    store.GetFarm(farmId) is { } farm ? Results.Ok(farm) : Results.NotFound());
app.MapGet("/api/reports", (InMemoryAgroStatStore store, string? status) =>
    Results.Ok(store.GetReports(status)));
app.MapGet("/api/reports/{reportId:guid}", (Guid reportId, InMemoryAgroStatStore store) =>
    store.GetReport(reportId) is { } report ? Results.Ok(report) : Results.NotFound());
app.MapPut("/api/reports/{reportId:guid}/draft", (Guid reportId, SaveDraftRequest request, InMemoryAgroStatStore store) =>
    store.SaveDraft(reportId, request.Values) is { } report ? Results.Ok(report) : Results.NotFound());
app.MapPost("/api/reports/{reportId:guid}/submit", (Guid reportId, InMemoryAgroStatStore store) =>
    store.Submit(reportId, out var errors) is { } report
        ? Results.Ok(report)
        : Results.ValidationProblem(errors ?? new Dictionary<string, string[]> { ["report"] = ["Отчёт не найден."] }));
app.MapPost("/api/reports/{reportId:guid}/review", (Guid reportId, ReviewRequest request, InMemoryAgroStatStore store) =>
    store.Review(reportId, request) is { } report ? Results.Ok(report) : Results.NotFound());
app.MapPost("/api/telegram/identify", (TelegramIdentityRequest request, InMemoryAgroStatStore store) =>
    store.IdentifyTelegramUser(request) is { } farm ? Results.Ok(farm) : Results.NotFound(new { message = "Хозяйство с таким кодом не найдено." }));

app.Run();
