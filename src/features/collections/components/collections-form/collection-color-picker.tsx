import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { COLLECTION_COLORS } from "../../schemas/types";

interface CollectionColorPickerProps {
	value: string;
	onChange: (color: string) => void;
}

export function CollectionColorPicker({
	value,
	onChange,
}: CollectionColorPickerProps) {
	return (
		<div className="flex flex-wrap gap-2">
			{COLLECTION_COLORS.map((color) => (
				<button
					key={color.value}
					type="button"
					className={cn(
						"flex h-7 w-7 items-center justify-center rounded-full transition-transform hover:scale-110",
						value === color.value &&
							"ring-2 ring-offset-2 ring-offset-background",
					)}
					style={{
						backgroundColor: color.value,
						...(value === color.value ? { ringColor: color.value } : {}),
					}}
					onClick={() => onChange(color.value)}
					aria-label={color.name}
					title={color.name}
				>
					{value === color.value && (
						<Check className="h-3.5 w-3.5 text-white" />
					)}
				</button>
			))}
		</div>
	);
}
