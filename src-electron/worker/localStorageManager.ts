import * as fs from 'fs';
import * as path from 'path';

export interface LocalCampaign {
  id: string;
  name: string;
  message: string;
  workerId: string;
  status: 'pending' | 'running' | 'completed' | 'paused' | 'failed';
  startedAt?: string;
  completedAt?: string;
  totalContacts: number;
  sentCount: number;
  failedCount: number;
  contacts: Array<{
    phone: string;
    name?: string;
    variables?: Record<string, string>;
  }>;
  media?: Array<{
    type: string;
    data: string;
    filename: string;
  }>;
}

export interface LocalMessageLog {
  id: string;
  campaignId: string;
  phone: string;
  status: 'sent' | 'failed';
  error?: string;
  timestamp: string;
}

export class LocalStorageManager {
  private basePath: string;
  private campaignsPath: string;
  private logsPath: string;

  constructor(userDataPath: string) {
    this.basePath = path.join(userDataPath, 'local-campaigns');
    this.campaignsPath = path.join(this.basePath, 'campaigns');
    this.logsPath = path.join(this.basePath, 'logs');

    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    [this.basePath, this.campaignsPath, this.logsPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  saveCampaign(campaign: LocalCampaign): void {
    const filePath = path.join(this.campaignsPath, `${campaign.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(campaign, null, 2), 'utf-8');
  }

  getCampaign(campaignId: string): LocalCampaign | null {
    try {
      const filePath = path.join(this.campaignsPath, `${campaignId}.json`);
      if (!fs.existsSync(filePath)) {
        return null;
      }
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading campaign:', error);
      return null;
    }
  }

  getAllCampaigns(): LocalCampaign[] {
    try {
      const files = fs.readdirSync(this.campaignsPath);
      const campaigns: LocalCampaign[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.campaignsPath, file);
          const data = fs.readFileSync(filePath, 'utf-8');
          campaigns.push(JSON.parse(data));
        }
      }

      return campaigns.sort((a, b) => {
        const dateA = a.startedAt ? new Date(a.startedAt).getTime() : 0;
        const dateB = b.startedAt ? new Date(b.startedAt).getTime() : 0;
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error reading campaigns:', error);
      return [];
    }
  }

  updateCampaign(campaignId: string, updates: Partial<LocalCampaign>): void {
    const campaign = this.getCampaign(campaignId);
    if (campaign) {
      const updated = { ...campaign, ...updates };
      this.saveCampaign(updated);
    }
  }

  deleteCampaign(campaignId: string): void {
    try {
      const filePath = path.join(this.campaignsPath, `${campaignId}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const logFilePath = path.join(this.logsPath, `${campaignId}.json`);
      if (fs.existsSync(logFilePath)) {
        fs.unlinkSync(logFilePath);
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  }

  saveMessageLog(log: LocalMessageLog): void {
    try {
      const logFilePath = path.join(this.logsPath, `${log.campaignId}.json`);
      let logs: LocalMessageLog[] = [];

      if (fs.existsSync(logFilePath)) {
        const data = fs.readFileSync(logFilePath, 'utf-8');
        logs = JSON.parse(data);
      }

      logs.push(log);
      fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving message log:', error);
    }
  }

  getMessageLogs(campaignId: string): LocalMessageLog[] {
    try {
      const logFilePath = path.join(this.logsPath, `${campaignId}.json`);
      if (!fs.existsSync(logFilePath)) {
        return [];
      }
      const data = fs.readFileSync(logFilePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading message logs:', error);
      return [];
    }
  }

  exportCampaignData(campaignId: string): { campaign: LocalCampaign | null, logs: LocalMessageLog[] } {
    return {
      campaign: this.getCampaign(campaignId),
      logs: this.getMessageLogs(campaignId)
    };
  }

  getCampaignStats(campaignId: string): {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  } {
    const logs = this.getMessageLogs(campaignId);
    const sent = logs.filter(l => l.status === 'sent').length;
    const failed = logs.filter(l => l.status === 'failed').length;
    const campaign = this.getCampaign(campaignId);
    const total = campaign?.totalContacts || 0;

    return {
      total,
      sent,
      failed,
      pending: Math.max(0, total - sent - failed)
    };
  }

  clearOldCampaigns(daysOld: number = 30): void {
    try {
      const campaigns = this.getAllCampaigns();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      campaigns.forEach(campaign => {
        const completedAt = campaign.completedAt ? new Date(campaign.completedAt) : null;
        if (completedAt && completedAt < cutoffDate) {
          this.deleteCampaign(campaign.id);
        }
      });
    } catch (error) {
      console.error('Error clearing old campaigns:', error);
    }
  }
}
