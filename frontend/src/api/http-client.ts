import type { FarmDto, ReportDto, SaveDraftDto, SubmitReportDto, ReviewReportDto, UserDto, CreateUserDto } from './dto'

const STORAGE_KEY_REPORTS = 'agrostat_reports_v4'
const STORAGE_KEY_FARMS = 'agrostat_farms_v4'
const STORAGE_KEY_USERS = 'agrostat_users_v4'

const initialFarms: FarmDto[] = [
  {
    id: 'farm-1',
    name: 'ООО «Агро-Нива»',
    short_name: 'Агро-Нива',
    fiscal_code: '0200034125',
    district: 'Слободзейский район',
    settlement: 'с. Чобручи',
    phone: '+373 777 12-345',
    contact_person: 'Иванов Петр Сергеевич',
    activity_type: 'crops',
    assigned_forms: ['1-фермер', '2-фермер'],
  },
  {
    id: 'farm-2',
    name: 'КФХ «Золотой Колос»',
    short_name: 'Золотой Колос',
    fiscal_code: '0200089452',
    district: 'Григориопольский район',
    settlement: 'пос. Маяк',
    phone: '+373 778 98-765',
    contact_person: 'Сидоренко Анна Васильевна',
    activity_type: 'mixed',
    assigned_forms: ['1-фермер', '2-фермер', '3-фермер'],
  },
  {
    id: 'farm-3',
    name: 'ООО «МясоМолПром»',
    short_name: 'МясоМолПром',
    fiscal_code: '0200011294',
    district: 'Рыбницкий район',
    settlement: 'с. Ержово',
    phone: '+373 779 44-556',
    contact_person: 'Ковальчук Михаил Дмитриевич',
    activity_type: 'livestock',
    assigned_forms: ['3-фермер'],
  },
]

const initialUsers: UserDto[] = [
  {
    id: 'usr-farmer-1',
    login: '0200034125',
    name: 'Иванов Петр Сергеевич (ООО «Агро-Нива»)',
    role: 'farmer',
    phone: '+373 777 12-345',
    district: 'Слободзейский район',
    farm_id: 'farm-1',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'usr-farmer-2',
    login: '0200089452',
    name: 'Сидоренко Анна Васильевна (КФХ «Золотой Колос»)',
    role: 'farmer',
    phone: '+373 778 98-765',
    district: 'Григориопольский район',
    farm_id: 'farm-2',
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: 'usr-farmer-3',
    login: '0200011294',
    name: 'Ковальчук Михаил Дмитриевич (ООО «МясоМолПром»)',
    role: 'farmer',
    phone: '+373 779 44-556',
    district: 'Рыбницкий район',
    farm_id: 'farm-3',
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: 'usr-spec-1',
    login: 'specialist_slobodzeya',
    name: 'Григорьева Елена Николаевна',
    role: 'specialist',
    email: 'stat.slobodzeya@stat.gospmr.org',
    phone: '+373 557 2-44-11',
    district: 'Слободзейский район',
    created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
  },
  {
    id: 'usr-spec-2',
    login: 'specialist_center',
    name: 'Васильев Олег Игоревич',
    role: 'specialist',
    email: 'agro.stat@stat.gospmr.org',
    phone: '+373 533 9-10-20',
    district: 'Центральный аппарат (Все районы)',
    created_at: new Date(Date.now() - 86400000 * 90).toISOString(),
  },
  {
    id: 'usr-admin-1',
    login: 'admin',
    name: 'Администратор системы «АгроСтат»',
    role: 'admin',
    email: 'admin@stat.gospmr.org',
    phone: '+373 533 8-00-01',
    created_at: new Date(Date.now() - 86400000 * 120).toISOString(),
  },
]

const initialReports: ReportDto[] = [
  // 1. ООО «Агро-Нива» (Растениеводство) - Форма 1 и Форма 2
  {
    id: 'rep-farm1-1',
    farm_id: 'farm-1',
    farm_name: 'ООО «Агро-Нива»',
    fiscal_code: '0200034125',
    district: 'Слободзейский район',
    form_code: '1-фермер',
    form_title: 'Отчет об итогах сева под урожай',
    period: '2026 год',
    year: 2026,
    status: 'in_progress',
    values: {
      '001': 140.0,
      '002': 110.0,
      '003': 30.0,
      '007': 10.0,
      '008': 10.0,
      '014': 130.0,
      '015': 100.0,
      '016': 30.0,
      '020': 180.0,
      '021': 60.0,
      '024': 120.0,
      '039': 95.0,
      '040': 95.0,
      '062': 23.5,
      '063': 15.0,
      '066': 8.5,
      '069': 5.0,
      '070': 3.5,
      '114': 298.5,
      '141': 20.0,
      '150': 448.5,
      '160': 500.0,
      '161': 500.0,
      '190': 51.5,
    },
    previous_values: {
      '001': 135.0,
      '014': 130.0,
      '150': 440.0,
      '160': 500.0,
      '161': 500.0,
    },
    row_comments: {},
    confirmed_warnings: {},
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rep-farm1-2',
    farm_id: 'farm-1',
    farm_name: 'ООО «Агро-Нива»',
    fiscal_code: '0200034125',
    district: 'Слободзейский район',
    form_code: '2-фермер',
    form_title: 'Отчет о сборе урожая сельскохозяйственных культур',
    period: '2026 год',
    year: 2026,
    status: 'draft',
    values: {
      '100': 180.0,
      '101': 7200.0,
      '102': 100.0,
      '103': 4500.0,
      '104': 30.0,
      '105': 1050.0,
      '106': 50.0,
      '107': 1650.0,
      '200': 95.0,
      '201': 2375.0,
      '202': 95.0,
      '203': 2375.0,
    },
    previous_values: {
      '100': 175.0,
      '101': 6880.0,
      '200': 90.0,
      '201': 2160.0,
    },
    row_comments: {},
    confirmed_warnings: {},
    updated_at: new Date(Date.now() - 1800000).toISOString(),
  },

  // 2. ООО «МясоМолПром» (Животноводство) - Форма 3
  {
    id: 'rep-farm3-1',
    farm_id: 'farm-3',
    farm_name: 'ООО «МясоМолПром»',
    fiscal_code: '0200011294',
    district: 'Рыбницкий район',
    form_code: '3-фермер',
    form_title: 'Отчет о производстве продукции животноводства и численности скота',
    period: '2026 год',
    year: 2026,
    status: 'in_progress',
    values: {
      '010': 340,
      '011': 160,
      '012': 75,
      '020': 520,
      '021': 45,
      '060': 145,
      '061': 480,
      '070': 420.5,
      '100': 7840.0,
      '160': 650.0,
      '161': 380.0,
      '162': 270.0,
      '170': 7200.0,
    },
    previous_values: {
      '010': 325,
      '011': 155,
      '020': 500,
      '100': 7500.0,
    },
    row_comments: {},
    confirmed_warnings: {},
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rep-2',
    farm_id: 'farm-2',
    farm_name: 'КФХ «Золотой Колос»',
    fiscal_code: '0200089452',
    district: 'Григориопольский район',
    form_code: '1-фермер',
    form_title: 'Отчет об итогах сева под урожай',
    period: '2026 год',
    year: 2026,
    status: 'submitted',
    values: {
      '001': 80.0,
      '002': 80.0,
      '014': 80.0,
      '015': 80.0,
      '020': 110.0,
      '024': 110.0,
      '040': 70.0,
      '114': 180.0,
      '150': 260.0,
      '160': 280.0,
      '161': 280.0,
      '190': 20.0,
    },
    previous_values: {
      '001': 85.0,
      '014': 80.0,
      '150': 260.0,
    },
    row_comments: {},
    confirmed_warnings: {},
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    submitted_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'rep-3',
    farm_id: 'farm-2',
    farm_name: 'КФХ «Золотой Колос»',
    fiscal_code: '0200089452',
    district: 'Григориопольский район',
    form_code: '3-фермер',
    form_title: 'Отчет о производстве продукции животноводства',
    period: 'III квартал 2026',
    year: 2026,
    status: 'needs_revision',
    values: {
      '010': 45,
      '011': 22,
      '020': 120,
      '050': 180,
    },
    previous_values: {
      '010': 50,
      '011': 25,
      '020': 115,
      '050': 175,
    },
    row_comments: {
      '010': 'Часть поголовья переведена на соседнюю ферму',
    },
    confirmed_warnings: {},
    revision_comment: 'Уточните строку 010 (поголовье КРС) и приложите справку о движении скота.',
    updated_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'rep-hist-1',
    farm_id: 'farm-1',
    farm_name: 'ООО «Агро-Нива»',
    fiscal_code: '0200034125',
    district: 'Слободзейский район',
    form_code: '1-фермер',
    form_title: 'Отчет об итогах сева под урожай',
    period: '2025 год (Архив)',
    year: 2025,
    status: 'approved',
    values: {
      '001': 135.0,
      '002': 105.0,
      '003': 30.0,
      '007': 5.0,
      '008': 5.0,
      '014': 130.0,
      '015': 100.0,
      '016': 30.0,
      '020': 175.0,
      '021': 55.0,
      '024': 120.0,
      '040': 90.0,
      '063': 15.0,
      '066': 8.0,
      '114': 288.0,
      '141': 22.0,
      '150': 440.0,
      '160': 500.0,
      '161': 500.0,
      '190': 60.0,
    },
    previous_values: {
      '001': 130.0,
      '150': 435.0,
    },
    row_comments: {},
    confirmed_warnings: {},
    updated_at: '2025-06-08T14:30:00.000Z',
    submitted_at: '2025-06-08T14:30:00.000Z',
    approved_at: '2025-06-09T09:15:00.000Z',
  },
  {
    id: 'rep-hist-2',
    farm_id: 'farm-1',
    farm_name: 'ООО «Агро-Нива»',
    fiscal_code: '0200034125',
    district: 'Слободзейский район',
    form_code: '2-фермер',
    form_title: 'Отчет о сборе урожая сельскохозяйственных культур',
    period: '2025 год (Архив)',
    year: 2025,
    status: 'approved',
    values: {
      '010': 280.0,
      '011': 11200.0,
      '020': 160.0,
      '021': 6880.0,
      '030': 120.0,
      '031': 4320.0,
      '040': 90.0,
      '041': 2160.0,
    },
    previous_values: {},
    row_comments: {},
    confirmed_warnings: {},
    updated_at: '2025-11-25T11:20:00.000Z',
    submitted_at: '2025-11-25T11:20:00.000Z',
    approved_at: '2025-11-26T16:45:00.000Z',
  },
]

function getStoredReports(): ReportDto[] {
  const data = localStorage.getItem(STORAGE_KEY_REPORTS)
  if (!data) {
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(initialReports))
    return initialReports
  }
  try {
    return JSON.parse(data) as ReportDto[]
  } catch {
    return initialReports
  }
}

function saveStoredReports(reports: ReportDto[]): void {
  localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(reports))
}

function getStoredFarms(): FarmDto[] {
  const data = localStorage.getItem(STORAGE_KEY_FARMS)
  if (!data) {
    localStorage.setItem(STORAGE_KEY_FARMS, JSON.stringify(initialFarms))
    return initialFarms
  }
  try {
    return JSON.parse(data) as FarmDto[]
  } catch {
    return initialFarms
  }
}

function saveStoredFarms(farms: FarmDto[]): void {
  localStorage.setItem(STORAGE_KEY_FARMS, JSON.stringify(farms))
}

function getStoredUsers(): UserDto[] {
  const data = localStorage.getItem(STORAGE_KEY_USERS)
  if (!data) {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(initialUsers))
    return initialUsers
  }
  try {
    return JSON.parse(data) as UserDto[]
  } catch {
    return initialUsers
  }
}

function saveStoredUsers(users: UserDto[]): void {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users))
}

export const httpClient = {
  async authenticate(login: string, _password?: string): Promise<{ user: UserDto; farm?: FarmDto } | null> {
    const users = getStoredUsers()
    const cleanLogin = login.trim().toLowerCase()
    const user = users.find((u) => u.login.toLowerCase() === cleanLogin || (u.phone && u.phone.includes(login.trim())))

    if (!user) return null

    let farm: FarmDto | undefined
    if (user.farm_id) {
      const farms = getStoredFarms()
      farm = farms.find((f) => f.id === user.farm_id)
    }

    return { user, farm }
  },

  async getUsers(): Promise<UserDto[]> {
    return Promise.resolve(getStoredUsers())
  },

  async createUser(payload: CreateUserDto): Promise<UserDto> {
    const users = getStoredUsers()
    const farms = getStoredFarms()

    let farmId = undefined

    if (payload.role === 'farmer') {
      farmId = `farm-${Date.now()}`
      const newFarm: FarmDto = {
        id: farmId,
        name: payload.farm_name || payload.name,
        short_name: payload.farm_name || payload.name,
        fiscal_code: payload.fiscal_code || payload.login,
        district: payload.district || 'Слободзейский район',
        settlement: 'с. Центральное',
        phone: payload.phone || '+373 777 00-000',
        contact_person: payload.name,
        activity_type: payload.activity_type || 'crops',
        assigned_forms: payload.assigned_forms || ['1-фермер'],
      }
      farms.push(newFarm)
      saveStoredFarms(farms)

      // Также создаем черновик для назначенной формы
      const reports = getStoredReports()
      const newReport: ReportDto = {
        id: `rep-${Date.now()}`,
        farm_id: farmId,
        farm_name: newFarm.name,
        fiscal_code: newFarm.fiscal_code,
        district: newFarm.district,
        form_code: '1-фермер',
        form_title: 'Отчет об итогах сева под урожай',
        period: '2026 год',
        year: 2026,
        status: 'draft',
        values: {},
        previous_values: {},
        row_comments: {},
        confirmed_warnings: {},
        updated_at: new Date().toISOString(),
      }
      reports.push(newReport)
      saveStoredReports(reports)
    }

    const newUser: UserDto = {
      id: `usr-${Date.now()}`,
      login: payload.login,
      name: payload.name,
      role: payload.role,
      phone: payload.phone,
      email: payload.email,
      district: payload.district,
      farm_id: farmId,
      created_at: new Date().toISOString(),
    }

    users.push(newUser)
    saveStoredUsers(users)
    return Promise.resolve(newUser)
  },

  async deleteUser(userId: string): Promise<void> {
    const users = getStoredUsers().filter((u) => u.id !== userId)
    saveStoredUsers(users)
  },

  async getFarms(): Promise<FarmDto[]> {
    return Promise.resolve(getStoredFarms())
  },

  async getFarmById(farmId: string): Promise<FarmDto | null> {
    const farms = getStoredFarms()
    return Promise.resolve(farms.find((f) => f.id === farmId) || null)
  },

  async getReportsByFarm(farmId: string): Promise<ReportDto[]> {
    const all = getStoredReports()
    return Promise.resolve(all.filter((r) => r.farm_id === farmId))
  },

  async getAllReports(): Promise<ReportDto[]> {
    return Promise.resolve(getStoredReports())
  },

  async getReportById(reportId: string): Promise<ReportDto | null> {
    const all = getStoredReports()
    return Promise.resolve(all.find((r) => r.id === reportId) || null)
  },

  async saveDraft(dto: SaveDraftDto): Promise<ReportDto> {
    const all = getStoredReports()
    const index = all.findIndex((r) => r.id === dto.report_id)
    if (index === -1) {
      throw new Error(`Report not found: ${dto.report_id}`)
    }
    const current = all[index]
    const updated: ReportDto = {
      ...current,
      values: { ...dto.values },
      row_comments: dto.row_comments ? { ...dto.row_comments } : current.row_comments,
      confirmed_warnings: dto.confirmed_warnings ? { ...dto.confirmed_warnings } : current.confirmed_warnings,
      status: current.status === 'draft' ? 'in_progress' : current.status,
      updated_at: new Date().toISOString(),
    }
    all[index] = updated
    saveStoredReports(all)
    return Promise.resolve(updated)
  },

  async submitReport(dto: SubmitReportDto): Promise<ReportDto> {
    const all = getStoredReports()
    const index = all.findIndex((r) => r.id === dto.report_id)
    if (index === -1) {
      throw new Error(`Report not found: ${dto.report_id}`)
    }
    const updated: ReportDto = {
      ...all[index],
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    all[index] = updated
    saveStoredReports(all)
    return Promise.resolve(updated)
  },

  async reviewReport(dto: ReviewReportDto): Promise<ReportDto> {
    const all = getStoredReports()
    const index = all.findIndex((r) => r.id === dto.report_id)
    if (index === -1) {
      throw new Error(`Report not found: ${dto.report_id}`)
    }
    const updated: ReportDto = {
      ...all[index],
      status: dto.action === 'approve' ? 'approved' : 'needs_revision',
      revision_comment: dto.action === 'reject' ? dto.revision_comment : undefined,
      approved_at: dto.action === 'approve' ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    }
    all[index] = updated
    saveStoredReports(all)
    return Promise.resolve(updated)
  },
}
