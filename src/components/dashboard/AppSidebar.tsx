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
  Sparkles,
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

const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Search Hotels", url: "/dashboard/search", icon: SearchIcon },
  { title: "Trips", url: "/trips", icon: CalendarIcon, badge: "3" },
  { title: "Reports", url: "/reporting/bookings", icon: FileTextIcon },
  { title: "Clients", url: "/clients", icon: UsersIcon },
];

const secondaryNavItems = [
  { title: "Settings", url: "/settings", icon: SettingsIcon },
  { title: "Help & Support", url: "/support", icon: HelpCircleIcon },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const isActive = (url: string) => location.pathname === url;

  return (
    <Sidebar collapsible="icon" className="border-r-0 bg-primary">
      {/* Header with gradient and gold accent */}
      <SidebarHeader className="p-4 pb-6">
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-sidebar-gold to-sidebar-gold-dark flex items-center justify-center shrink-0 shadow-lg shadow-sidebar-gold/20 group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:h-9">
              <GlobeIcon className="w-5 h-5 text-primary group-data-[collapsible=icon]:w-4 group-data-[collapsible=icon]:h-4" />
              <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-sidebar-gold animate-pulse" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-heading text-xl text-primary-foreground tracking-wide">
                  TravelHub
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/60">
                  Agent Portal
                </span>
              </div>
            )}
          </div>
          {/* Decorative accent line */}
          {!collapsed && (
            <div className="mt-4 h-px bg-gradient-to-r from-sidebar-gold/60 via-sidebar-gold/30 to-transparent" />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 mb-2 text-[10px] uppercase tracking-[0.2em] text-black font-semibold">
            Main Menu
          </SidebarGroupLabel>
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
                        relative flex items-center gap-3 px-3 py-3 rounded-lg
                        transition-all duration-300 ease-out
                        hover:text-primary-foreground
                        hover:bg-primary-foreground/10 hover:scale-[1.02]
                        ${isActive(item.url) 
                          ? 'bg-primary-foreground/15 text-primary-foreground font-semibold shadow-lg' 
                          : 'text-gray-400'
                        }
                      `}
                      activeClassName=""
                    >
                      {/* Gold accent bar for active state */}
                      {isActive(item.url) && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-sidebar-gold to-sidebar-gold-dark rounded-r-full shadow-glow-gold" />
                      )}
                      <item.icon className={`
                        w-5 h-5 shrink-0 transition-all duration-300
                        group-hover/item:scale-110
                        ${isActive(item.url) ? 'text-sidebar-gold' : ''}
                      `} />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.title}</span>
                          {item.badge && (
                            <Badge className="bg-sidebar-gold text-primary text-[10px] font-bold px-1.5 py-0 h-5 min-w-5 flex items-center justify-center rounded-full shadow-glow-gold">
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

        {/* Decorative divider */}
        {!collapsed && (
          <div className="my-4 mx-3 h-px bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent" />
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 mb-2 text-[10px] uppercase tracking-[0.2em] text-black font-semibold">
            Support
          </SidebarGroupLabel>
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
                        relative flex items-center gap-3 px-3 py-3 rounded-lg
                        transition-all duration-300 ease-out
                        hover:text-primary-foreground
                        hover:bg-primary-foreground/10 hover:scale-[1.02]
                        ${isActive(item.url) 
                          ? 'bg-primary-foreground/15 text-primary-foreground font-semibold shadow-lg' 
                          : 'text-gray-400'
                        }
                      `}
                      activeClassName=""
                    >
                      {isActive(item.url) && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-sidebar-gold to-sidebar-gold-dark rounded-r-full shadow-glow-gold" />
                      )}
                      <item.icon className={`
                        w-5 h-5 shrink-0 transition-all duration-300
                        group-hover/item:scale-110
                        ${isActive(item.url) ? 'text-sidebar-gold' : ''}
                      `} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 pt-2">
        {/* Decorative divider */}
        {!collapsed && (
          <div className="mb-4 h-px bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent" />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
