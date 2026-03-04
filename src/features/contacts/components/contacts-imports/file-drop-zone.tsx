import { useCallback, useRef, useState } from "react";
import { Upload, FileText, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateFile } from "@/features/contacts/utils/parse-import-file";
import {
	downloadImportTemplate,
	IMPORT_TEMPLATE_HEADERS,
} from "@/features/contacts/utils/download-import-template";

interface FileDropZoneProps {
	file: File | null;
	onFileSelect: (file: File) => void;
	onFileClear: () => void;
	error: string | null;
}

export function FileDropZone({
	file,
	onFileSelect,
	onFileClear,
	error,
}: FileDropZoneProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [validationError, setValidationError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFile = useCallback(
		(f: File) => {
			const err = validateFile(f);
			if (err) {
				setValidationError(err);
				return;
			}
			setValidationError(null);
			onFileSelect(f);
		},
		[onFileSelect],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			const droppedFile = e.dataTransfer.files[0];
			if (droppedFile) handleFile(droppedFile);
		},
		[handleFile],
	);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const selected = e.target.files?.[0];
			if (selected) handleFile(selected);
			if (inputRef.current) inputRef.current.value = "";
		},
		[handleFile],
	);

	const displayError = validationError || error;

	if (file) {
		return (
			<div className="space-y-2">
				<div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-3">
					<FileText className="size-5 shrink-0 text-blue-500" />
					<div className="min-w-0 flex-1">
						<p className="truncate text-xs font-medium">{file.name}</p>
						<p className="text-xs text-muted-foreground">
							{(file.size / 1024).toFixed(1)} KB
						</p>
					</div>
					<Button
						variant="ghost"
						size="sm"
						className="h-7 w-7 p-0"
						onClick={onFileClear}
					>
						<X className="size-4" />
					</Button>
				</div>
				{displayError && (
					<p className="text-xs text-red-500">{displayError}</p>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div
				role="button"
				tabIndex={0}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				onClick={() => inputRef.current?.click()}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
				}}
				className={`flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed p-8 text-center transition-colors ${
					isDragging
						? "border-blue-500 bg-blue-500/5"
						: "border-muted-foreground/25 hover:border-muted-foreground/50"
				}`}
			>
				<Upload className="size-8 text-muted-foreground" />
				<div>
					<p className="text-xs font-medium">
						Drop your file here, or click to browse
					</p>
					<p className="mt-1 text-xs text-muted-foreground">
						Supports CSV, XLSX, XLS (max 10MB)
					</p>
				</div>
			</div>
			<input
				ref={inputRef}
				type="file"
				accept=".csv,.xlsx,.xls"
				className="hidden"
				onChange={handleInputChange}
			/>

			{displayError && (
				<p className="text-xs text-red-500">{displayError}</p>
			)}

			<div className="rounded-md border border-border bg-muted/20 p-3 space-y-2">
				<p className="text-xs font-medium">Expected format</p>
				<p className="text-xs text-muted-foreground">
					Your file should include the following columns. Only{" "}
					<span className="font-semibold text-foreground">Email</span> is
					required — all other columns are optional.
				</p>
				<div className="flex flex-wrap gap-1.5">
					{IMPORT_TEMPLATE_HEADERS.map((header) => (
						<span
							key={header}
							className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ${
								header === "Email"
									? "bg-blue-500/10 text-blue-600 font-medium ring-1 ring-blue-500/20"
									: "bg-muted text-muted-foreground"
							}`}
						>
							{header}
							{header === "Email" && (
								<span className="ml-1 text-[10px]">*</span>
							)}
						</span>
					))}
				</div>
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						downloadImportTemplate();
					}}
					className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium mt-1"
				>
					<Download className="size-3" />
					Download template file
				</button>
			</div>
		</div>
	);
}
