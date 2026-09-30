import type { FarmDto, ReportDto, SaveDraftDto, SubmitReportDto, ReviewReportDto, UserDto, CreateUserDto } from './dto'

const STORAGE_KEY_REPORTS = 'agrostat_reports_v7'
const STORAGE_KEY_FARMS = 'agrostat_farms_v7'
const STORAGE_KEY_USERS = 'agrostat_users_v7'

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
    period: 'I полугодие 2026 г.',
    year: 2026,
    status: 'submitted',
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
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    submitted_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'rep-farm3-2',
    farm_id: 'farm-3',
    farm_name: 'ООО «МясоМолПром»',
    fiscal_code: '0200011294',
    district: 'Рыбницкий район',
    form_code: '3-фермер',
    form_title: 'Отчет о производстве продукции животноводства и численности скота',
    period: '9 месяцев 2026 г.',
    year: 2026,
    status: 'in_progress',
    values: {
      '010': 355,
      '011': 165,
      '012': 80,
      '020': 540,
      '021': 48,
      '060': 145,
      '061': 480,
      '070': 580.0,
      '100': 11400.0,
      '160': 710.0,
      '161': 420.0,
      '162': 290.0,
      '170': 9500.0,
    },
    previous_values: {
      '010': 340,
      '011': 160,
      '020': 520,
      '100': 7840.0,
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
  // ==========================================
  // АРХИВ ПРЕДЫДУЩЕГО ПЕРИОДА (2025 год)
  // Сданные и утвержденные отчеты для всех хозяйств
  // ==========================================

  // Хозяйство 1: ООО «Агро-Нива» (Растениеводство)
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
      '100': 175.0,
      '101': 6880.0,
      '102': 100.0,
      '103': 4300.0,
      '104': 25.0,
      '105': 980.0,
      '106': 50.0,
      '107': 1600.0,
      '200': 90.0,
      '201': 2160.0,
      '202': 90.0,
      '203': 2160.0,
    },
    previous_values: {},
    row_comments: {},
    confirmed_warnings: {},
    updated_at: '2025-11-25T11:20:00.000Z',
    submitted_at: '2025-11-25T11:20:00.000Z',
    approved_at: '2025-11-26T16:45:00.000Z',
  },

  // Хозяйство 2: КФХ «Золотой Колос» (Смешанное хозяйство)
  {
    id: 'rep-hist-farm2-1',
    farm_id: 'farm-2',
    farm_name: 'КФХ «Золотой Колос»',
    fiscal_code: '0200089452',
    district: 'Григориопольский район',
    form_code: '1-фермер',
    form_title: 'Отчет об итогах сева под урожай',
    period: '2025 год (Архив)',
    year: 2025,
    status: 'approved',
    values: {
      '001': 85.0,
      '002': 85.0,
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
      '001': 80.0,
      '014': 75.0,
    },
    row_comments: {},
    confirmed_warnings: {},
    updated_at: '2025-06-05T10:15:00.000Z',
    submitted_at: '2025-06-05T10:15:00.000Z',
    approved_at: '2025-06-06T11:00:00.000Z',
  },
  {
    id: 'rep-hist-farm2-2',
    farm_id: 'farm-2',
    farm_name: 'КФХ «Золотой Колос»',
    fiscal_code: '0200089452',
    district: 'Григориопольский район',
    form_code: '2-фермер',
    form_title: 'Отчет о сборе урожая сельскохозяйственных культур',
    period: '2025 год (Архив)',
    year: 2025,
    status: 'approved',
    values: {
      '100': 110.0,
      '101': 4400.0,
      '102': 80.0,
      '103': 3360.0,
      '104': 30.0,
      '105': 1040.0,
      '200': 70.0,
      '201': 1540.0,
      '202': 70.0,
      '203': 1540.0,
    },
    previous_values: {},
    row_comments: {},
    confirmed_warnings: {},
    updated_at: '2025-11-20T14:40:00.000Z',
    submitted_at: '2025-11-20T14:40:00.000Z',
    approved_at: '2025-11-21T09:30:00.000Z',
  },
  {
    id: 'rep-hist-farm2-3',
    farm_id: 'farm-2',
    farm_name: 'КФХ «Золотой Колос»',
    fiscal_code: '0200089452',
    district: 'Григориопольский район',
    form_code: '3-фермер',
    form_title: 'Отчет о производстве продукции животноводства и численности скота',
    period: '2025 год (Архив)',
    year: 2025,
    status: 'approved',
    values: {
      '010': 50,
      '011': 25,
      '012': 10,
      '020': 115,
      '021': 12,
      '030': 40,
      '050': 175,
      '070': 85.0,
      '100': 1250.0,
      '160': 180.0,
      '161': 100.0,
      '162': 80.0,
    },
    previous_values: {},
    row_comments: {},
    confirmed_warnings: {},
    updated_at: '2025-12-10T16:00:00.000Z',
    submitted_at: '2025-12-10T16:00:00.000Z',
    approved_at: '2025-12-11T10:20:00.000Z',
  },

  // Хозяйство 3: ООО «МясоМолПром» (Животноводство)
  {
    id: 'rep-hist-farm3-1',
    farm_id: 'farm-3',
    farm_name: 'ООО «МясоМолПром»',
    fiscal_code: '0200011294',
    district: 'Рыбницкий район',
    form_code: '3-фермер',
    form_title: 'Отчет о производстве продукции животноводства и численности скота',
    period: '2025 год (Архив)',
    year: 2025,
    status: 'approved',
    values: {
      '010': 325,
      '011': 155,
      '012': 70,
      '020': 500,
      '021': 40,
      '060': 140,
      '061': 450,
      '070': 395.0,
      '100': 7500.0,
      '160': 620.0,
      '161': 360.0,
      '162': 260.0,
      '170': 6900.0,
    },
    previous_values: {},
    row_comments: {},
    confirmed_warnings: {},
    updated_at: '2025-12-15T15:30:00.000Z',
    submitted_at: '2025-12-15T15:30:00.000Z',
    approved_at: '2025-12-16T11:45:00.000Z',
  },
]

function getStoredReports(): ReportDto[] {
  const data = localStorage.getItem(STORAGE_KEY_REPORTS)
  if (!data) {
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(initialReports))
    return initialReports
  }
  try {
    const parsed = JSON.parse(data) as ReportDto[]
    const existingIds = new Set(parsed.map((r) => r.id))
    let hasChanges = false
    for (const initRep of initialReports) {
      if (!existingIds.has(initRep.id)) {
        parsed.push(initRep)
        hasChanges = true
      }
    }
    if (hasChanges) {
      localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(parsed))
    }
    return parsed
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
    const parsed = JSON.parse(data) as FarmDto[]
    const existingIds = new Set(parsed.map((f) => f.id))
    let hasChanges = false
    for (const initFarm of initialFarms) {
      if (!existingIds.has(initFarm.id)) {
        parsed.push(initFarm)
        hasChanges = true
      }
    }
    if (hasChanges) {
      localStorage.setItem(STORAGE_KEY_FARMS, JSON.stringify(parsed))
    }
    return parsed
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
    const parsed = JSON.parse(data) as UserDto[]
    const existingIds = new Set(parsed.map((u) => u.id))
    let hasChanges = false
    for (const initUser of initialUsers) {
      if (!existingIds.has(initUser.id)) {
        parsed.push(initUser)
        hasChanges = true
      }
    }
    if (hasChanges) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(parsed))
    }
    return parsed
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

    if (user.deleted_at) {
      throw new Error('Учетная запись деактивирована администратором и перенесена в архив.')
    }

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
        deleted_at: null,
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
        deleted_at: null,
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
      deleted_at: null,
    }

    users.push(newUser)
    saveStoredUsers(users)
    return Promise.resolve(newUser)
  },

  async deleteUser(userId: string): Promise<void> {
    const users = getStoredUsers()
    const user = users.find((u) => u.id === userId)
    if (user) {
      user.deleted_at = new Date().toISOString()
      saveStoredUsers(users)

      if (user.farm_id) {
        const farms = getStoredFarms()
        const farm = farms.find((f) => f.id === user.farm_id)
        if (farm) {
          farm.deleted_at = user.deleted_at
          saveStoredFarms(farms)
        }
      }
    }
    return Promise.resolve()
  },

  async restoreUser(userId: string): Promise<void> {
    const users = getStoredUsers()
    const user = users.find((u) => u.id === userId)
    if (user) {
      user.deleted_at = null
      saveStoredUsers(users)

      if (user.farm_id) {
        const farms = getStoredFarms()
        const farm = farms.find((f) => f.id === user.farm_id)
        if (farm) {
          farm.deleted_at = null
          saveStoredFarms(farms)
        }
      }
    }
    return Promise.resolve()
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
