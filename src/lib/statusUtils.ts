import { ComplianceStatus, HOURS_PER_DAY_LIMIT } from '@/types/audit';

export function getStatusColor(status: ComplianceStatus): string {
  switch (status) {
    case 'valid':
      return 'bg-status-valid border-status-valid';
    case 'warning':
      return 'bg-status-warning border-status-warning';
    case 'violation':
      return 'bg-status-violation border-status-violation';
  }
}

export function getStatusBorder(status: ComplianceStatus): string {
  switch (status) {
    case 'valid':
      return 'border-status-valid';
    case 'warning':
      return 'border-status-warning';
    case 'violation':
      return 'border-status-violation';
  }
}

export function getStatusClasses(status: ComplianceStatus): string {
  switch (status) {
    case 'valid':
      return 'border-status-valid bg-status-valid-bg';
    case 'warning':
      return 'border-status-warning bg-status-warning-bg';
    case 'violation':
      return 'border-status-violation bg-status-violation-bg';
  }
}

export function getDailyStatusClass(hours: number): string {
  if (hours > HOURS_PER_DAY_LIMIT) {
    return 'bg-status-violation-bg border-status-violation text-status-violation';
  }
  if (hours > HOURS_PER_DAY_LIMIT - 1) {
    return 'bg-status-warning-bg border-status-warning text-status-warning';
  }
  return 'border-border/30';
}
