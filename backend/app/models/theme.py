"""
Theme Model - Gerenciamento de Temas Light/Dark
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base
import json


class Theme(Base):
    """
    Modelo para temas personalizados do sistema.
    """
    __tablename__ = "themes"

    id = Column(Integer, primary_key=True, index=True)
    
    # Identificação
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Tipo de tema
    theme_type = Column(String(20), nullable=False, default="dark")  # 'light' ou 'dark'
    
    # Cores principais (JSON)
    colors = Column(Text, nullable=False)  # JSON com todas as cores
    
    # Tipografia
    font_family = Column(String(100), nullable=True, default="Inter")
    font_size_base = Column(String(10), nullable=True, default="16px")
    
    # Arredondamento e sombras
    border_radius = Column(String(20), nullable=True, default="0.5rem")
    shadow_style = Column(String(20), nullable=True, default="medium")  # none, small, medium, large
    
    # Criador
    created_by = Column(Integer, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Theme(name='{self.name}', type='{self.theme_type}')>"

    @staticmethod
    def get_default_dark_theme():
        """Retorna as cores padrão do tema dark."""
        return {
            # Backgrounds
            "background": "#09090b",
            "foreground": "#fafafa",
            "card": "#18181b",
            "cardForeground": "#fafafa",
            "popover": "#18181b",
            "popoverForeground": "#fafafa",
            
            # Primário
            "primary": "#3b82f6",
            "primaryForeground": "#fafafa",
            "primaryHover": "#2563eb",
            
            # Secundário
            "secondary": "#27272a",
            "secondaryForeground": "#fafafa",
            "secondaryHover": "#3f3f46",
            
            # Muted
            "muted": "#27272a",
            "mutedForeground": "#a1a1aa",
            
            # Accent
            "accent": "#27272a",
            "accentForeground": "#fafafa",
            
            # Destructive
            "destructive": "#ef4444",
            "destructiveForeground": "#fafafa",
            
            # Borders
            "border": "#27272a",
            "input": "#27272a",
            "ring": "#3b82f6",
            
            # Status
            "success": "#22c55e",
            "warning": "#f59e0b",
            "info": "#3b82f6",
            "error": "#ef4444",
            
            # Text
            "textPrimary": "#fafafa",
            "textSecondary": "#a1a1aa",
            "textMuted": "#71717a",
            
            # Sidebar
            "sidebar": "#09090b",
            "sidebarForeground": "#fafafa",
            "sidebarBorder": "#27272a",
            "sidebarAccent": "#27272a",
            "sidebarAccentForeground": "#fafafa",
        }

    @staticmethod
    def get_default_light_theme():
        """Retorna as cores padrão do tema light moderno e elegante."""
        return {
            # Backgrounds - tons claros e suaves
            "background": "#f8fafc",  # Slate-50
            "foreground": "#0f172a",  # Slate-900
            "card": "#ffffff",  # Branco puro para cards
            "cardForeground": "#1e293b",  # Slate-800
            "popover": "#ffffff",
            "popoverForeground": "#1e293b",
            
            # Primário - Azul moderno
            "primary": "#2563eb",  # Blue-600
            "primaryForeground": "#ffffff",
            "primaryHover": "#1d4ed8",  # Blue-700
            
            # Secundário - Cinza suave
            "secondary": "#f1f5f9",  # Slate-100
            "secondaryForeground": "#334155",  # Slate-700
            "secondaryHover": "#e2e8f0",  # Slate-200
            
            # Muted
            "muted": "#f1f5f9",
            "mutedForeground": "#64748b",  # Slate-500
            
            # Accent - Indigo suave
            "accent": "#eef2ff",  # Indigo-50
            "accentForeground": "#4338ca",  # Indigo-700
            
            # Destructive
            "destructive": "#dc2626",  # Red-600
            "destructiveForeground": "#ffffff",
            
            # Borders - Cinza muito claro
            "border": "#e2e8f0",  # Slate-200
            "input": "#e2e8f0",
            "ring": "#2563eb",
            
            # Status
            "success": "#16a34a",  # Green-600
            "warning": "#d97706",  # Amber-600
            "info": "#2563eb",
            "error": "#dc2626",
            
            # Text
            "textPrimary": "#0f172a",
            "textSecondary": "#475569",  # Slate-600
            "textMuted": "#94a3b8",  # Slate-400
            
            # Sidebar
            "sidebar": "#ffffff",
            "sidebarForeground": "#1e293b",
            "sidebarBorder": "#e2e8f0",
            "sidebarAccent": "#f1f5f9",
            "sidebarAccentForeground": "#1e293b",
        }


class UserThemePreference(Base):
    """
    Preferências de tema por usuário.
    """
    __tablename__ = "user_theme_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, nullable=False, index=True)
    
    # Tema selecionado
    theme_id = Column(Integer, ForeignKey("themes.id"), nullable=True)
    
    # Modo automático (sistema)
    follow_system = Column(Boolean, default=False)
    
    # Preferência manual
    preferred_mode = Column(String(20), nullable=True, default="dark")  # 'light', 'dark', 'auto'
    
    # Customizações do usuário
    custom_colors = Column(Text, nullable=True)  # Override de cores específicas
    
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<UserThemePreference(user_id={self.user_id}, mode='{self.preferred_mode}')>"


class ThemeHistory(Base):
    """
    Histórico de mudanças de tema.
    """
    __tablename__ = "theme_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    
    previous_theme_id = Column(Integer, nullable=True)
    new_theme_id = Column(Integer, nullable=True)
    
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
    changed_by = Column(String(100), nullable=True)  # system ou user_id

    def __repr__(self):
        return f"<ThemeHistory(user_id={self.user_id})>"
