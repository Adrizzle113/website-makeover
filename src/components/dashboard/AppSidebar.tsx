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
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const isActive = (url: string) => location.pathname === url;

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-background">
      {/* Header with clean design */}
      <SidebarHeader className="p-4 pb-6">
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-md group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:h-9">
              <GlobeIcon className="w-5 h-5 text-primary-foreground group-data-[collapsible=icon]:w-4 group-data-[collapsible=icon]:h-4" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-heading text-xl text-foreground tracking-wide">
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
            <div className="mt-4 h-px bg-gradient-to-r from-border via-border/60 to-transparent" />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
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
                        relative flex items-center gap-3 px-3 py-3 rounded-xl
                        transition-all duration-300 ease-out
                        hover:bg-muted hover:scale-[1.02]
                        ${isActive(item.url) 
                          ? 'bg-primary text-primary-foreground font-medium shadow-md' 
                          : 'text-foreground/70 hover:text-foreground'
                        }
                      `}
                      activeClassName=""
                    >
                      <item.icon className={`
                        w-5 h-5 shrink-0 transition-all duration-300
                        group-hover/item:scale-110
                        ${isActive(item.url) ? 'text-primary-foreground' : ''}
                      `} />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.title}</span>
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
          <SidebarGroupLabel className="px-3 mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
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
                        relative flex items-center gap-3 px-3 py-3 rounded-xl
                        transition-all duration-300 ease-out
                        hover:bg-muted hover:scale-[1.02]
                        ${isActive(item.url) 
                          ? 'bg-primary text-primary-foreground font-medium shadow-md' 
                          : 'text-foreground/70 hover:text-foreground'
                        }
                      `}
                      activeClassName=""
                    >
                      <item.icon className={`
                        w-5 h-5 shrink-0 transition-all duration-300
                        group-hover/item:scale-110
                        ${isActive(item.url) ? 'text-primary-foreground' : ''}
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
        {/* Subtle divider */}
        {!collapsed && (
          <div className="mb-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
