export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
  ram_quota: number;
  cpu_quota: number;
  disk_quota: number;
  created_at: string;
}

export interface Node {
  id: number;
  name: string;
  ip: string;
  api_key?: string;
  status: 'online' | 'offline';
  is_local: boolean;
  created_at: string;
}

export interface Container {
  id: number;
  name: string;
  node_id: number;
  user_id: number;
  os: string;
  ram: number;
  cpu: number;
  disk: number;
  status: 'running' | 'stopped' | 'starting' | 'stopping';
  ip_address?: string;
  created_at: string;
  node_name?: string;
  owner_name?: string;
}

export interface PortForward {
  id: number;
  container_id: number;
  container_name?: string;
  public_port: number;
  private_port: number;
  protocol: 'tcp' | 'udp';
}

export interface Package {
  id: number;
  name: string;
  ram: number;
  cpu: number;
  disk: number;
  bandwidth: number;
}

export interface DashboardStats {
  containers: number;
  active: number;
  nodes: number;
  users: number;
}
