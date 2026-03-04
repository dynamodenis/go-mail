import { useCallback, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import OrbiterBox from "@/components/global/orbiter-box";
import Divider from "@/components/ui/divider";
import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sooner";
import { useImportContacts } from "@/features/contacts/api/queries";
import { parseImportFile } from "@/features/contacts/utils/parse-import-file";
import {
	autoDetectMapping,
	validateParsedContacts,
} from "@/features/contacts/utils/validate-parsed-contacts";
import { FileDropZone } from "./file-drop-zone";
import { ColumnMapper } from "./column-mapper";
import { ImportPreviewTable } from "./import-preview-table";
import { ImportCollectionSelect } from "./import-collection-select";
import type {
	ContactFieldMapping,
	ImportStep,
	ParsedContactRow,
	ParsedFileResult,
} from "@/features/contacts/schemas/types";

interface ImportContactModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const STEP_TITLES: Record<ImportStep, string> = {
	upload: "Upload File",
	mapping: "Map Columns",
	preview: "Preview & Import",
};

const STEP_DESCRIPTIONS: Record<ImportStep, string> = {
	upload: "Import contacts from a CSV or Excel file.",
	mapping: "Map file columns to contact fields.",
	preview: "Review contacts before importing.",
};

export const ImportContactModal = ({
	open,
	onOpenChange,
}: ImportContactModalProps) => {
	const [step, setStep] = useState<ImportStep>("upload");
	const [file, setFile] = useState<File | null>(null);
	const [parsedFile, setParsedFile] = useState<ParsedFileResult | null>(null);
	const [mapping, setMapping] = useState<ContactFieldMapping[]>([]);
	const [parsedContacts, setParsedContacts] = useState<ParsedContactRow[]>([]);
	const [collectionId, setCollectionId] = useState<string | null>(null);
	const [parseError, setParseError] = useState<string | null>(null);

	const { mutate: importContacts, isPending } = useImportContacts();

	const resetState = useCallback(() => {
		setStep("upload");
		setFile(null);
		setParsedFile(null);
		setMapping([]);
		setParsedContacts([]);
		setCollectionId(null);
		setParseError(null);
	}, []);

	const handleClose = useCallback(() => {
		onOpenChange(false);
		resetState();
	}, [onOpenChange, resetState]);

	const handleFileSelect = useCallback(async (f: File) => {
		setFile(f);
		setParseError(null);
		try {
			const result = await parseImportFile(f);
			if (result.rows.length === 0) {
				setParseError("File contains no data rows.");
				return;
			}
			setParsedFile(result);
			const detected = autoDetectMapping(result.headers, result.rows[0]);
			setMapping(detected);
			setStep("mapping");
		} catch (err) {
			setParseError(err instanceof Error ? err.message : "Failed to parse file.");
		}
	}, []);

	const handleFileClear = useCallback(() => {
		setFile(null);
		setParsedFile(null);
		setMapping([]);
		setParseError(null);
	}, []);

	const handleProceedToPreview = useCallback(() => {
		if (!parsedFile) return;
		const contacts = validateParsedContacts(parsedFile.rows, mapping);
		setParsedContacts(contacts);
		setStep("preview");
	}, [parsedFile, mapping]);

	const handleImport = useCallback(() => {
		const validContacts = parsedContacts.filter((c) => c.isValid);
		if (validContacts.length === 0) {
			toast.error("No valid contacts to import.");
			return;
		}

		const contacts = validContacts.map((c) => ({
			email: c.email,
			firstName: c.firstName,
			lastName: c.lastName,
			phone: c.phone,
			company: c.company,
			status: "ACTIVE" as const,
		}));

		importContacts(
			{
				contacts,
				collectionId: collectionId ?? undefined,
			},
			{
				onSuccess: (res) => {
					if ("error" in res) {
						toast.error("Import failed", { description: res.error.message });
						return;
					}
					toast.success("Contacts imported", {
						description: `${res.data.importedCount} contacts imported successfully.`,
					});
					handleClose();
				},
				onError: () => {
					toast.error("Import failed", {
						description: "An unexpected error occurred.",
					});
				},
			},
		);
	}, [parsedContacts, collectionId, importContacts, handleClose]);

	const hasEmailMapping = mapping.some((m) => m.field === "email");
	const validCount = parsedContacts.filter((c) => c.isValid).length;

	const handleBack = useCallback(() => {
		if (step === "mapping") setStep("upload");
		else if (step === "preview") setStep("mapping");
	}, [step]);

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="w-full max-w-2xl p-0 overflow-hidden sm:rounded-lg">
				<OrbiterBox variant="blue-light-horizontal" borderRadius={8}>
					<div className="flex flex-col bg-background sm:rounded-lg">
						<div className="flex items-center justify-between px-6 py-2">
							<div className="flex items-center gap-2">
								{step !== "upload" && (
									<Button
										variant="ghost"
										size="sm"
										className="h-7 w-7 p-0"
										onClick={handleBack}
									>
										<ArrowLeft className="h-4 w-4" />
									</Button>
								)}
								<div>
									<DialogTitle className="text-sm font-semibold">
										{STEP_TITLES[step]}
									</DialogTitle>
									<DialogDescription className="mt-1 text-xs text-muted-foreground">
										{STEP_DESCRIPTIONS[step]}
									</DialogDescription>
								</div>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="h-7 w-7 p-0"
								onClick={handleClose}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
						<Divider variant="blue-light-horizontal" />

						<div className="space-y-4 p-6">
							{step === "upload" && (
								<FileDropZone
									file={file}
									onFileSelect={handleFileSelect}
									onFileClear={handleFileClear}
									error={parseError}
								/>
							)}

							{step === "mapping" && (
								<>
									<ColumnMapper
										mapping={mapping}
										onMappingChange={setMapping}
									/>
									<div className="flex justify-end">
										<Button
											size="sm"
											disabled={!hasEmailMapping}
											onClick={handleProceedToPreview}
										>
											Continue to Preview
										</Button>
									</div>
								</>
							)}

							{step === "preview" && (
								<>
									<ImportPreviewTable contacts={parsedContacts} />
									<ImportCollectionSelect
										value={collectionId}
										onChange={setCollectionId}
									/>
									<div className="flex justify-end">
										<Button
											size="sm"
											disabled={isPending || validCount === 0}
											onClick={handleImport}
										>
											{isPending
												? "Importing..."
												: `Import ${validCount} Contact${validCount !== 1 ? "s" : ""}`}
										</Button>
									</div>
								</>
							)}
						</div>
					</div>
				</OrbiterBox>
			</DialogContent>
		</Dialog>
	);
};
