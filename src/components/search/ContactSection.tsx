import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ContactSection() {
  return (
    <section id="contact" className="py-24 bg-background">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            <span className="heading-spaced text-primary mb-6 block">
              Get in Touch
            </span>
            <h2 className="font-heading text-display-md text-foreground mb-6">
              Let's Create Amazing Travel Together!
            </h2>
            <p className="text-body-lg text-muted-foreground mb-8">
              Have questions or ready to start planning? Fill out the form and 
              our travel experts will get back to you within 24 hours.
            </p>

            {/* Decorative Image */}
            <div className="hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80"
                alt="Travel planning"
                className="rounded-3xl"
              />
            </div>
          </div>

          {/* Form */}
          <div className="bg-card p-8 md:p-10 rounded-3xl shadow-card">
            <form className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-body-sm font-medium mb-2 block">
                    First Name
                  </label>
                  <Input
                    placeholder="John"
                    className="rounded-xl h-12"
                  />
                </div>
                <div>
                  <label className="text-body-sm font-medium mb-2 block">
                    Last Name
                  </label>
                  <Input
                    placeholder="Doe"
                    className="rounded-xl h-12"
                  />
                </div>
              </div>

              <div>
                <label className="text-body-sm font-medium mb-2 block">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  className="rounded-xl h-12"
                />
              </div>

              <div>
                <label className="text-body-sm font-medium mb-2 block">
                  Preferred Destination
                </label>
                <Select>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder="Select a destination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bali">Bali, Indonesia</SelectItem>
                    <SelectItem value="switzerland">Switzerland</SelectItem>
                    <SelectItem value="newzealand">New Zealand</SelectItem>
                    <SelectItem value="iceland">Iceland</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-body-sm font-medium mb-2 block">
                  Message
                </label>
                <Textarea
                  placeholder="Tell us about your dream trip..."
                  className="rounded-xl min-h-[120px]"
                />
              </div>

              <Button className="w-full rounded-full h-12 text-body-md">
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}