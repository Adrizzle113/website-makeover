import { useLocation } from "react-router-dom";
import {
  LayoutDashboardIcon,
  SearchIcon,
  CalendarIcon,
  FileTextIcon,
  UsersIcon,
  SettingsIcon,
  GlobeIcon,
  HelpCircleIcon,
  FolderOpenIcon,
  PanelLeftIcon,
  PanelRightIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Search Hotels", url: "/dashboard/search", icon: SearchIcon },
  { title: "My Bookings", url: "/dashboard/my-bookings", icon: CalendarIcon },
  { title: "Trips", url: "/trips", icon: GlobeIcon, badge: "3" },
  { title: "Documents", url: "/documents", icon: FolderOpenIcon },
  { title: "Reports", url: "/reporting/bookings", icon: FileTextIcon },
  { title: "Clients", url: "/clients", icon: UsersIcon },
];

const secondaryNavItems = [
  { title: "Settings", url: "/settings", icon: SettingsIcon },
  { title: "Help & Support", url: "/support", icon: HelpCircleIcon },
];

export function AppSidebar() {
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  const isActive = (url: string) => location.pathname === url;

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-background overflow-hidden">
      {/* Header with clean design */}
      <SidebarHeader className={collapsed ? "p-2 pb-4" : "p-4 pb-6"}>
        <div className="relative flex flex-col items-center">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className={`relative rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-md ${collapsed ? 'w-9 h-9' : 'w-11 h-11'}`}>
              <GlobeIcon className={`text-primary-foreground ${collapsed ? 'w-4 h-4' : 'w-5 h-5'}`} />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-heading text-xl text-foreground tracking-wide truncate">
                  TravelHub
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Agent Portal
                </span>
              </div>
            )}
          </div>
          {/* Subtle accent line */}
          {!collapsed && (
            <div className="mt-4 w-full h-px bg-gradient-to-r from-border via-border/60 to-transparent" />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className={collapsed ? "px-1" : "px-2"}>
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="px-3 mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
              Main Menu
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainNavItems.map((item, index) => (
                <SidebarMenuItem 
                  key={item.title}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className="group/item"
                  >
                    <NavLink
                      to={item.url}
                      className={`
                        relative flex items-center gap-3 rounded-xl
                        transition-all duration-300 ease-out
                        hover:bg-muted hover:scale-[1.02]
                        ${collapsed ? 'justify-center px-2 py-3' : 'px-3 py-3'}
                        ${isActive(item.url) 
                          ? 'bg-primary text-primary-foreground font-medium shadow-md' 
                          : 'text-foreground/70 hover:text-foreground'
                        }
                      `}
                      activeClassName=""
                    >
                      <item.icon className="w-5 h-5 shrink-0 transition-all duration-300 group-hover/item:scale-110" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.title}</span>
                          {item.badge && (
                            <Badge className="bg-foreground text-background text-[10px] font-bold px-1.5 py-0 h-5 min-w-5 flex items-center justify-center rounded-full">
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Subtle divider */}
        {!collapsed && (
          <div className="my-4 mx-3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        )}

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="px-3 mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
              Support
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {secondaryNavItems.map((item, index) => (
                <SidebarMenuItem 
                  key={item.title}
                  className="animate-fade-in"
                  style={{ animationDelay: `${(mainNavItems.length + index) * 50}ms` }}
                >
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className="group/item"
                  >
                    <NavLink
                      to={item.url}
                      className={`
                        relative flex items-center gap-3 rounded-xl
                        transition-all duration-300 ease-out
                        hover:bg-muted hover:scale-[1.02]
                        ${collapsed ? 'justify-center px-2 py-3' : 'px-3 py-3'}
                        ${isActive(item.url) 
                          ? 'bg-primary text-primary-foreground font-medium shadow-md' 
                          : 'text-foreground/70 hover:text-foreground'
                        }
                      `}
                      activeClassName=""
                    >
                      <item.icon className="w-5 h-5 shrink-0 transition-all duration-300 group-hover/item:scale-110" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 pt-2">
        {/* Subtle divider */}
        {!collapsed && (
          <div className="mb-3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        )}
        
        {/* Collapse toggle button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className={`
                w-full flex items-center gap-2 px-3 py-2 rounded-lg
                text-muted-foreground hover:text-foreground hover:bg-muted
                transition-all duration-200
                ${collapsed ? 'justify-center' : 'justify-start'}
              `}
            >
              {collapsed ? (
                <PanelRightIcon className="w-4 h-4" />
              ) : (
                <>
                  <PanelLeftIcon className="w-4 h-4" />
                  <span className="text-sm">Collapse</span>
                </>
              )}
            </Button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right">
              <p>Expand sidebar</p>
            </TooltipContent>
          )}
        </Tooltip>
      </SidebarFooter>
    </Sidebar>
  );
}
