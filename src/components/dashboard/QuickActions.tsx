import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  Download,
  ShoppingCart,
  Trash2,
  Settings,
  BarChart,
} from "lucide-react";

type Props = {
  propertyId?: string;
};

function ActionCard({
  href,
  title,
  subtitle,
  icon: Icon,
  badge,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: any;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="block focus:outline-none focus:ring-2 focus:ring-ring rounded-xl"
    >
      <Card className="active:scale-[0.99] transition-transform h-full">
        <CardContent className="p-2 h-full">
          <div className="flex flex-col items-center justify-center gap-2 text-center h-full">
            <div className="h-5 w-5 rounded-lg border bg-background flex items-center justify-center">
              <Icon className="h-4 w-4" />
            </div>

            <div>
              <div className="flex items-center justify-center gap-2">
                <div className="text-base font-semibold leading-none">
                  {title}
                </div>
                {badge ? (
                  <Badge variant="secondary" className="h-5 px-2 text-[11px]">
                    {badge}
                  </Badge>
                ) : null}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {subtitle}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function QuickActions({ propertyId }: Props) {
  const qp = propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : "";

  return (
    <div className="grid grid-cols-2 gap-3 auto-rows-fr">
      <ActionCard
        href={`/app/dispatch${qp}`}
        title="Dispatch"
        subtitle="Send soiled to laundry"
        icon={ArrowUpRight}
        badge="Fast"
      />
      <ActionCard
        href={`/app/receive${qp}`}
        title="Receive"
        subtitle="Get clean back"
        icon={Download}
      />
      <ActionCard
        href={`/admin/procurement${qp}`}
        title="Procurement"
        subtitle="Add new stock"
        icon={ShoppingCart}
      />
      <ActionCard
        href={`/admin/discard${qp}`}
        title="Discard"
        subtitle="Lost / damaged out"
        icon={Trash2}
      />

      <ActionCard
        href={`/admin/settings${qp}`}
        title="Settings"
        subtitle="Manage application settings"
        icon={Settings}
      />
      <ActionCard
        href={`/admin/reports${qp}`}
        title="Reports"
        subtitle="View analytics and reports"
        icon={BarChart}
      />
    </div>
  );
}
