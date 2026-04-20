import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAutomations } from "@/api/mockApi";
import type { FieldConfig } from "./formConfig";

type Props = {
  field: FieldConfig;
  value: any;
  data: any;
  onChange: (patch: Record<string, any>) => void;
  invalid?: boolean;
};

export function FieldRenderer({ field, value, data, onChange, invalid }: Props) {
  const set = (v: any) => onChange({ [field.name]: v });
  const errClass = invalid ? "border-destructive focus-visible:ring-destructive/40" : "";

  if (field.type === "text" || field.type === "number" || field.type === "date") {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">
          {field.label}{field.required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
        <Input
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
          placeholder={field.placeholder}
          value={value ?? ""}
          onChange={(e) => set(field.type === "number" ? Number(e.target.value) : e.target.value)}
          className={errClass}
        />
        {invalid && <p className="text-[11px] font-medium text-destructive">This field is required</p>}
        {!invalid && field.helper && <p className="text-[11px] text-muted-foreground">{field.helper}</p>}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{field.label}</Label>
        <Textarea rows={3} placeholder={field.placeholder} value={value ?? ""} onChange={(e) => set(e.target.value)} />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">
          {field.label}{field.required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
        <Select value={value || ""} onValueChange={set}>
          <SelectTrigger className={errClass}><SelectValue placeholder="Choose..." /></SelectTrigger>
          <SelectContent>
            {field.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {invalid && <p className="text-[11px] font-medium text-destructive">Please choose an option</p>}
      </div>
    );
  }

  if (field.type === "toggle") {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
        <div>
          <Label className="text-xs font-medium">{field.label}</Label>
          {field.helper && <p className="text-[11px] text-muted-foreground">{field.helper}</p>}
        </div>
        <Switch checked={!!value} onCheckedChange={set} />
      </div>
    );
  }

  if (field.type === "keyValueList") {
    const list: { key: string; value: string }[] = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-2">
        <Label className="text-xs font-medium">{field.label}</Label>
        <div className="space-y-1.5">
          {list.map((kv, i) => (
            <div key={i} className="flex gap-1.5">
              <Input className="flex-1" placeholder="key" value={kv.key} onChange={(e) => {
                const next = [...list]; next[i] = { ...kv, key: e.target.value }; set(next);
              }} />
              <Input className="flex-1" placeholder="value" value={kv.value} onChange={(e) => {
                const next = [...list]; next[i] = { ...kv, value: e.target.value }; set(next);
              }} />
              <Button type="button" variant="ghost" size="icon" onClick={() => set(list.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => set([...list, { key: "", value: "" }])}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add field
          </Button>
        </div>
      </div>
    );
  }

  if (field.type === "dynamicAction") {
    return <DynamicActionField value={value} data={data} onChange={onChange} field={field} />;
  }

  return null;
}

function DynamicActionField({ value, data, onChange, field }: Props) {
  const { data: automations = [], isLoading } = useQuery({
    queryKey: ["automations"],
    queryFn: getAutomations,
    staleTime: 1000 * 60 * 5,
  });

  const selected = automations.find((a) => a.id === value);
  const params = (data?.params || {}) as Record<string, string>;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">
          {field.label}{field.required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
        <Select value={value || ""} onValueChange={(v) => onChange({ actionId: v, params: {} })}>
          <SelectTrigger>
            <SelectValue placeholder={isLoading ? "Loading actions..." : "Choose an action"} />
          </SelectTrigger>
          <SelectContent>
            {automations.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{a.label}</span>
                  <span className="text-[11px] text-muted-foreground">{a.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {field.helper && <p className="text-[11px] text-muted-foreground">{field.helper}</p>}
      </div>

      {selected && (
        <div className="animate-fade-in space-y-2.5 rounded-xl border border-border bg-accent/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-accent-foreground">Action parameters</span>
            <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{selected.id}</span>
          </div>
          {selected.params.map((p) => (
            <div key={p.name} className="space-y-1">
              <Label className="text-[11px] font-medium">
                {p.label}{p.required && <span className="ml-0.5 text-destructive">*</span>}
              </Label>
              {p.type === "textarea" ? (
                <Textarea rows={2} value={params[p.name] ?? ""} onChange={(e) => onChange({ params: { ...params, [p.name]: e.target.value } })} />
              ) : (
                <Input
                  type={p.type === "number" ? "number" : p.type === "email" ? "email" : "text"}
                  value={params[p.name] ?? ""}
                  onChange={(e) => onChange({ params: { ...params, [p.name]: e.target.value } })}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
