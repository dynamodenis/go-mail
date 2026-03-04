import { useMemo } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type {
	ContactField,
	ContactFieldMapping,
} from "@/features/contacts/schemas/types";

const CONTACT_FIELDS: { value: ContactField; label: string }[] = [
	{ value: "email", label: "Email" },
	{ value: "firstName", label: "First Name" },
	{ value: "lastName", label: "Last Name" },
	{ value: "phone", label: "Phone" },
	{ value: "company", label: "Company" },
];

const SKIP_VALUE = "__skip__";

interface ColumnMapperProps {
	mapping: ContactFieldMapping[];
	onMappingChange: (mapping: ContactFieldMapping[]) => void;
}

export function ColumnMapper({ mapping, onMappingChange }: ColumnMapperProps) {
	const usedFields = useMemo(() => {
		const fields = new Set<ContactField>();
		for (const m of mapping) {
			if (m.field) fields.add(m.field);
		}
		return fields;
	}, [mapping]);

	const hasEmailMapping = usedFields.has("email");

	const handleFieldChange = (index: number, value: string) => {
		const newMapping = [...mapping];
		newMapping[index] = {
			...newMapping[index],
			field: value === SKIP_VALUE ? null : (value as ContactField),
		};
		onMappingChange(newMapping);
	};

	return (
		<div className="space-y-3">
			<div className="max-h-64 overflow-auto rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="text-xs">File Column</TableHead>
							<TableHead className="text-xs">Sample Value</TableHead>
							<TableHead className="text-xs">Maps To</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{mapping.map((m, i) => (
							<TableRow key={m.header}>
								<TableCell className="text-xs font-medium">
									{m.header}
								</TableCell>
								<TableCell className="max-w-[150px] truncate text-xs text-muted-foreground">
									{m.sampleValue || "—"}
								</TableCell>
								<TableCell>
									<Select
										value={m.field ?? SKIP_VALUE}
										onValueChange={(v) => handleFieldChange(i, v)}
									>
										<SelectTrigger size="sm" className="h-7 w-[130px] text-xs">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value={SKIP_VALUE}>Skip</SelectItem>
											{CONTACT_FIELDS.map((cf) => (
												<SelectItem
													key={cf.value}
													value={cf.value}
													disabled={
														usedFields.has(cf.value) && m.field !== cf.value
													}
												>
													{cf.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{!hasEmailMapping && (
				<p className="text-xs text-red-500">
					An email column must be mapped to continue.
				</p>
			)}
		</div>
	);
}
