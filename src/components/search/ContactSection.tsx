import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ContactSection() {
  return (
    <section id="contact" className="py-16 md:py-24">
      <div className="container max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left - Form */}
          <div className="bg-background rounded-3xl p-8 md:p-12 shadow-sm">
            <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-3">
              Contact our <span className="italic">friendly</span> team
            </h1>
            <p className="text-muted-foreground mb-8">
              Ready to start? Let's chat about how we can help.
            </p>

            <form className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-foreground">
                    First name
                  </label>
                  <Input
                    placeholder="First name"
                    className="rounded-lg h-11 bg-background border-border"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-foreground">
                    Last name
                  </label>
                  <Input
                    placeholder="Last name"
                    className="rounded-lg h-11 bg-background border-border"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="you@company.com"
                  className="rounded-lg h-11 bg-background border-border"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">
                  Location
                </label>
                <Select>
                  <SelectTrigger className="rounded-lg h-11 bg-background border-border">
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brazil">Brazil</SelectItem>
                    <SelectItem value="usa">United States</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">
                  Message
                </label>
                <Textarea
                  placeholder="Tell us about your needs..."
                  className="rounded-lg min-h-[100px] bg-background border-border"
                />
              </div>

              <Button className="w-full rounded-lg h-11 text-base font-medium">
                Continue
              </Button>

              <div className="text-center pt-2">
                <a 
                  href="mailto:hello@example.com" 
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  hello@example.com
                </a>
              </div>
            </form>
          </div>

          {/* Right - Dashboard Preview */}
          <div className="hidden lg:block">
            <div className="relative">
              <div className="bg-foreground/5 rounded-3xl p-6 md:p-8">
                <div className="bg-background rounded-2xl shadow-xl overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-primary/10" />
                      <span className="font-semibold text-foreground">Dashboard</span>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                          <p className="text-lg font-semibold text-foreground">$88,820.44</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-xs text-muted-foreground mb-1">Net revenue</p>
                          <p className="text-lg font-semibold text-foreground">$79,604.16</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-xs text-muted-foreground mb-1">Views</p>
                          <p className="text-lg font-semibold text-foreground">112,440</p>
                        </div>
                      </div>
                      <div className="h-32 bg-muted/30 rounded-lg flex items-end justify-around px-4 pb-4">
                        {[40, 60, 45, 70, 55, 80, 65, 90, 75].map((height, i) => (
                          <div 
                            key={i} 
                            className="w-6 bg-foreground/10 rounded-t"
                            style={{ height: `${height}%` }}
                          />
                        ))}
                      </div>
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-muted" />
                            <div className="flex-1">
                              <div className="h-3 bg-muted rounded w-24 mb-1" />
                              <div className="h-2 bg-muted/50 rounded w-32" />
                            </div>
                            <div className="text-xs text-muted-foreground">Mar 4, 2025</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}