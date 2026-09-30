namespace AgroStat.Api;

public enum ReportStatus { Draft, Submitted, UnderReview, Accepted, Returned }
public record Farm(Guid Id, string Code, string Name, string District, bool CropProduction, bool Livestock, string? TelegramUserId = null);
public record Report(Guid Id, Guid FarmId, string FormCode, string Period, ReportStatus Status, Dictionary<string, decimal?> Values, string? Comment, DateTimeOffset UpdatedAt);
public record SaveDraftRequest(Dictionary<string, decimal?> Values);
public record ReviewRequest(bool Accepted, string? Comment);
public record TelegramIdentityRequest(string FarmCode, string TelegramUserId);

public sealed class InMemoryAgroStatStore
{
    private readonly List<Farm> _farms = [
        new(Guid.Parse("11111111-1111-1111-1111-111111111111"), "РЕГ-001247", "КФХ «Зелёная долина»", "Слободзейский район", true, false),
        new(Guid.Parse("22222222-2222-2222-2222-222222222222"), "РЕГ-000891", "ООО «Агро-Мир»", "Григориопольский район", true, true),
        new(Guid.Parse("33333333-3333-3333-3333-333333333333"), "РЕГ-000432", "СПК «Днестровский»", "Каменский район", false, true)
    ];
    private readonly List<Report> _reports;

    public InMemoryAgroStatStore()
    {
        _reports = _farms.SelectMany(farm => CreateReports(farm)).ToList();
    }
    public IEnumerable<Farm> FindFarms(string? search) => _farms.Where(f => string.IsNullOrWhiteSpace(search) || $"{f.Name} {f.Code}".Contains(search, StringComparison.OrdinalIgnoreCase));
    public Farm? GetFarm(Guid id) => _farms.SingleOrDefault(f => f.Id == id);
    public IEnumerable<object> GetReports(string? status) => _reports.Where(r => string.IsNullOrWhiteSpace(status) || r.Status.ToString().Equals(status, StringComparison.OrdinalIgnoreCase)).Select(ToResponse);
    public object? GetReport(Guid id) => _reports.SingleOrDefault(r => r.Id == id) is { } report ? ToResponse(report) : null;
    public object? SaveDraft(Guid id, Dictionary<string, decimal?> values)
    {
        var report = _reports.SingleOrDefault(r => r.Id == id); if (report is null || report.Status is ReportStatus.Accepted) return null;
        _reports[_reports.IndexOf(report)] = report with { Values = values, Status = ReportStatus.Draft, UpdatedAt = DateTimeOffset.UtcNow };
        return GetReport(id);
    }
    public object? Submit(Guid id, out Dictionary<string, string[]>? errors)
    {
        errors = null; var report = _reports.SingleOrDefault(r => r.Id == id); if (report is null) return null;
        var missing = RequiredFields(report).Where(key => !report.Values.TryGetValue(key, out var value) || value is null).ToArray();
        if (missing.Length > 0) { errors = missing.ToDictionary(key => key, _ => new[] { "Заполните обязательный показатель." }); return null; }
        _reports[_reports.IndexOf(report)] = report with { Status = ReportStatus.Submitted, UpdatedAt = DateTimeOffset.UtcNow };
        return GetReport(id);
    }
    public object? Review(Guid id, ReviewRequest request)
    {
        var report = _reports.SingleOrDefault(r => r.Id == id); if (report is null) return null;
        _reports[_reports.IndexOf(report)] = report with { Status = request.Accepted ? ReportStatus.Accepted : ReportStatus.Returned, Comment = request.Comment, UpdatedAt = DateTimeOffset.UtcNow };
        return GetReport(id);
    }
    public Farm? IdentifyTelegramUser(TelegramIdentityRequest request)
    {
        var farm = _farms.SingleOrDefault(f => f.Code.Equals(request.FarmCode, StringComparison.OrdinalIgnoreCase)); if (farm is null) return null;
        _farms[_farms.IndexOf(farm)] = farm with { TelegramUserId = request.TelegramUserId }; return GetFarm(farm.Id);
    }
    private IEnumerable<Report> CreateReports(Farm farm)
    {
        if (farm.CropProduction) yield return new(Guid.NewGuid(), farm.Id, "29-СХ", "III квартал 2026", farm.Id == _farms[0].Id ? ReportStatus.Draft : ReportStatus.Submitted, new() { ["sownArea"] = 120, ["harvest"] = null }, null, DateTimeOffset.UtcNow.AddHours(-2));
        if (farm.Livestock) yield return new(Guid.NewGuid(), farm.Id, "24-ЖИВ", "III квартал 2026", ReportStatus.Submitted, new() { ["cattle"] = 42, ["milk"] = 138 }, null, DateTimeOffset.UtcNow.AddDays(-1));
    }
    private IEnumerable<string> RequiredFields(Report report) => report.FormCode == "29-СХ" ? ["sownArea", "harvest"] : ["cattle", "milk"];
    private object ToResponse(Report report) { var farm = GetFarm(report.FarmId)!; return new { report.Id, report.FormCode, report.Period, report.Status, report.Values, report.Comment, report.UpdatedAt, farm = new { farm.Id, farm.Code, farm.Name, farm.CropProduction, farm.Livestock } }; }
}
