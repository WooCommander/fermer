export interface UserDto {
  id: string
  login: string
  name: string
  role: 'farmer' | 'specialist' | 'admin'
  phone?: string
  email?: string
  district?: string
  farm_id?: string
  created_at: string
}

export interface CreateUserDto {
  login: string
  password?: string
  name: string
  role: 'farmer' | 'specialist' | 'admin'
  phone?: string
  email?: string
  district?: string
  farm_name?: string
  fiscal_code?: string
  activity_type?: 'crops' | 'livestock' | 'mixed'
  assigned_forms?: string[]
}
