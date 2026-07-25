import React, { createContext, useContext, useState, useCallback, PropsWithChildren } from 'react';
import { AppConfig, VideoItem } from '../types';

const API_URL = '/api';

interface ConfigContextType {
  config: AppConfig;
  updateConfig: (newConfig: AppConfig) => Promise<boolean>;
  updateLocalPlaylist: (playlist: VideoItem[]) => void;
  normalizeConfig: (data: any) => AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>({} as AppConfig);

  const normalizeConfig = useCallback((data: any): AppConfig => {
    if (!data) return config;
    return {
      ...data,
      videoSource: data.video_source || data.videoSource,
      youtubeVideoId: data.youtube_video_id || data.youtubeVideoId,
      tickerMessage: data.ticker_message || data.tickerMessage,
      tickerSpeed: data.ticker_speed || data.tickerSpeed,
      salonName: data.salon_name || data.salonName,
      salonAddress: data.salon_address || data.salonAddress,
      salonPhone: data.salon_phone || data.salonPhone,
      ticketFooter: data.ticket_footer || data.ticketFooter,
      logoUrl: data.logo_url || data.logoUrl,
      webhookUrl: data.webhook_url || data.webhookUrl,
      ticketSize: data.ticket_size || data.ticketSize,
      loyalty: {
        enabled: (data.loyalty_enabled === 1 || data.loyalty_enabled === true) || (data.loyalty?.enabled),
        pointsPerVisit: parseFloat(data.loyalty_points_per_visit || data.loyalty?.pointsPerVisit || 0),
        redemptionThreshold: parseInt(data.loyalty_redemption_threshold || data.loyalty?.redemptionThreshold || 0),
        redemptionValue: parseFloat(data.loyalty_redemption_value || data.loyalty?.redemptionValue || 0),
        referralBonus: parseFloat(data.loyalty_referral_bonus || data.loyalty?.referralBonus || 0)
      },
      videoPlaylist: data.videoPlaylist || data.video_playlist || [],
      hiddenPanels: data.hiddenPanels || (data.hidden_panels ? (typeof data.hidden_panels === 'string' ? JSON.parse(data.hidden_panels) : data.hidden_panels) : []),
      latitude: data.latitude || data.lat || undefined,
      longitude: data.longitude || data.lng || undefined,
      geofenceRadius: parseInt(data.geofence_radius || data.geofenceRadius || 10),
      telegramBotToken: data.telegram_bot_token || data.telegramBotToken || '',
    };
  }, [config]);

  const updateConfig = async (newConfig: AppConfig): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/config`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      if (res.ok) { setConfig(newConfig); return true; }
    } catch (e) { console.error(e); }
    return false;
  };

  const updateLocalPlaylist = (playlist: VideoItem[]) =>
    setConfig((prev: any) => ({ ...prev, videoPlaylist: playlist }));

  return (
    <ConfigContext.Provider value={{ config, updateConfig, updateLocalPlaylist, normalizeConfig, setConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfigCtx = () => {
  const context = useContext(ConfigContext);
  if (!context) throw new Error("useConfigCtx must be used within a ConfigProvider");
  return context;
};
