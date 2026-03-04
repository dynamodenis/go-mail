import { useState, useDeferredValue } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useSearchCollections } from "@/features/collections/api/queries";

const NONE_VALUE = "__none__";

interface ImportCollectionSelectProps {
	value: string | null;
	onChange: (collectionId: string | null) => void;
}

export function ImportCollectionSelect({
	value,
	onChange,
}: ImportCollectionSelectProps) {
	const [search, setSearch] = useState("");
	const deferredSearch = useDeferredValue(search);
	const { data } = useSearchCollections(deferredSearch);
	const collections = data?.collections ?? [];

	return (
		<div className="space-y-1.5">
			<label className="text-xs font-medium">
				Add to collection (optional)
			</label>
			<Select
				value={value ?? NONE_VALUE}
				onValueChange={(v) => onChange(v === NONE_VALUE ? null : v)}
			>
				<SelectTrigger size="sm" className="w-full text-xs">
					<SelectValue placeholder="None" />
				</SelectTrigger>
				<SelectContent>
					<div className="p-1">
						<Input
							placeholder="Search collections..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-7 text-xs"
							onClick={(e) => e.stopPropagation()}
							onKeyDown={(e) => e.stopPropagation()}
						/>
					</div>
					<SelectItem value={NONE_VALUE}>None</SelectItem>
					{collections.map((c) => (
						<SelectItem key={c.id} value={c.id}>
							<span className="flex items-center gap-2">
								<span
									className="inline-block size-2.5 rounded-full"
									style={{ backgroundColor: c.color }}
								/>
								{c.name}
							</span>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
