import OrbiterBox from "@/components/global/orbiter-box";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import Divider from "@/components/ui/divider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Collection } from "@/features/collections/schemas/types";
import {
	useAddContactsToCollections,
	useSearchCollections,
} from "@/features/collections/api/queries";
import { toast } from "@/components/ui/sooner";
import {
	FolderPlus,
	Loader2,
	Search,
	FolderOpen,
	Users,
	X,
} from "lucide-react";
import {
	useCallback,
	useDeferredValue,
	useRef,
	useState,
} from "react";

interface AddToCollectionsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	contactIds: string[];
	onSuccess: () => void;
}

const SCROLL_THRESHOLD = 40;

export function AddToCollectionsDialog({
	open,
	onOpenChange,
	contactIds,
	onSuccess,
}: AddToCollectionsDialogProps) {
	const [search, setSearch] = useState("");
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const deferredSearch = useDeferredValue(search);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
	} = useSearchCollections(deferredSearch);

	const { mutate: addToCollections, isPending } =
		useAddContactsToCollections();

	const collections = data?.collections ?? [];
	const total = data?.total ?? 0;
	const contactCount = contactIds.length;

	const toggleCollection = useCallback((collectionId: string) => {
		setSelectedIds((prev) =>
			prev.includes(collectionId)
				? prev.filter((id) => id !== collectionId)
				: [...prev, collectionId],
		);
	}, []);

	const removeCollection = useCallback((collectionId: string) => {
		setSelectedIds((prev) => prev.filter((id) => id !== collectionId));
	}, []);

	const handleScroll = useCallback(() => {
		const el = dropdownRef.current;
		if (!el || !hasNextPage || isFetchingNextPage) return;
		const nearBottom =
			el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD;
		if (nearBottom) fetchNextPage();
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	const handleSave = () => {
		if (selectedIds.length === 0) return;
		addToCollections(
			{ contactIds, collectionIds: selectedIds },
			{
				onSuccess: (res) => {
					if ("error" in res) {
						toast.error("Failed to add contacts to collections");
						return;
					}
					const added = res.data.addedCount;
					toast.success(
						`Added ${contactCount} contact${contactCount > 1 ? "s" : ""} to ${selectedIds.length} collection${selectedIds.length > 1 ? "s" : ""}`,
					);
					setSelectedIds([]);
					setSearch("");
					onOpenChange(false);
					onSuccess();
				},
				onError: () =>
					toast.error("Failed to add contacts to collections"),
			},
		);
	};

	const handleClose = (nextOpen: boolean) => {
		if (!nextOpen && !isPending) {
			setSelectedIds([]);
			setSearch("");
			onOpenChange(false);
		}
	};

	const selectedCollections = collections.filter((c) =>
		selectedIds.includes(c.id),
	);

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="w-full max-w-md p-0 overflow-hidden sm:rounded-lg">
				<OrbiterBox variant="blue-light-horizontal" borderRadius={8}>
					<div className="flex flex-col bg-background sm:rounded-lg">
						<div className="px-6 py-4">
							<DialogTitle className="text-sm font-semibold">
								Add to Collections
							</DialogTitle>
							<DialogDescription className="mt-1 text-xs text-muted-foreground">
								Add{" "}
								<span className="font-medium text-foreground">
									{contactCount} contact{contactCount > 1 ? "s" : ""}
								</span>{" "}
								to one or more collections.
							</DialogDescription>
						</div>
						<Divider variant="blue-light-horizontal" />

						<div className="space-y-3 p-6">
							<SelectedBadges
								collections={selectedCollections}
								allSelectedIds={selectedIds}
								onRemove={removeCollection}
							/>

							<div className="relative">
								<Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
								<Input
									placeholder="Search collections..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="pl-8 text-xs placeholder:text-xs"
								/>
							</div>

							<div className="rounded-lg border border-border">
								<div className="flex items-center justify-between border-b border-border px-3 py-2">
									<span className="text-xs text-muted-foreground">
										{total} collection{total !== 1 ? "s" : ""}
									</span>
									<span className="text-xs font-medium text-primary">
										{selectedIds.length} selected
									</span>
								</div>

								<div
									ref={dropdownRef}
									onScroll={handleScroll}
									className="max-h-56 overflow-y-auto overscroll-contain"
								>
									{isLoading ? (
										<div className="flex items-center justify-center gap-2 py-8">
											<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
											<span className="text-xs text-muted-foreground">
												Loading collections...
											</span>
										</div>
									) : collections.length === 0 ? (
										<div className="flex flex-col items-center gap-1.5 py-8">
											<FolderOpen className="h-5 w-5 text-muted-foreground/50" />
											<span className="text-xs text-muted-foreground">
												{search
													? "No collections match your search"
													: "No collections found"}
											</span>
										</div>
									) : (
										<div className="p-1.5">
											{collections.map((collection) => (
												<CollectionCard
													key={collection.id}
													collection={collection}
													isSelected={selectedIds.includes(
														collection.id,
													)}
													onToggle={toggleCollection}
												/>
											))}
											{isFetchingNextPage && (
												<div className="flex items-center justify-center gap-2 py-3">
													<Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
													<span className="text-xs text-muted-foreground">
														Loading more...
													</span>
												</div>
											)}
										</div>
									)}
								</div>
							</div>

							<div className="flex justify-end gap-3 pt-1">
								<Button
									variant="outline"
									onClick={() => handleClose(false)}
									disabled={isPending}
								>
									Cancel
								</Button>
								<Button
									onClick={handleSave}
									disabled={isPending || selectedIds.length === 0}
								>
									{isPending ? (
										<>
											<Loader2 className="mr-1 h-4 w-4 animate-spin" />
											Adding...
										</>
									) : (
										<>
											<FolderPlus className="mr-1 h-4 w-4" />
											Add to {selectedIds.length || ""} Collection
											{selectedIds.length !== 1 ? "s" : ""}
										</>
									)}
								</Button>
							</div>
						</div>
					</div>
				</OrbiterBox>
			</DialogContent>
		</Dialog>
	);
}

function CollectionCard({
	collection,
	isSelected,
	onToggle,
}: {
	collection: Collection;
	isSelected: boolean;
	onToggle: (id: string) => void;
}) {
	return (
		<button
			type="button"
			onClick={() => onToggle(collection.id)}
			className={cn(
				"flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors",
				isSelected
					? "bg-primary/8 ring-1 ring-primary/20"
					: "hover:bg-accent/50",
			)}
		>
			<div
				className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
				style={{ backgroundColor: `${collection.color}18` }}
			>
				<div
					className="h-3 w-3 rounded-full"
					style={{ backgroundColor: collection.color }}
				/>
			</div>

			<div className="min-w-0 flex-1">
				<p className="truncate text-xs font-medium">{collection.name}</p>
				<p className="truncate text-[11px] text-muted-foreground">
					<Users className="mr-0.5 inline h-3 w-3" />
					{collection.contactCount} contact
					{collection.contactCount !== 1 ? "s" : ""}
				</p>
			</div>

			<Checkbox
				checked={isSelected}
				onCheckedChange={() => onToggle(collection.id)}
				onClick={(e) => e.stopPropagation()}
				className="shrink-0"
			/>
		</button>
	);
}

function SelectedBadges({
	collections,
	allSelectedIds,
	onRemove,
}: {
	collections: Collection[];
	allSelectedIds: string[];
	onRemove: (id: string) => void;
}) {
	if (allSelectedIds.length === 0) return null;

	const hiddenCount = allSelectedIds.length - collections.length;

	return (
		<div className="flex flex-wrap items-center gap-1.5">
			{collections.map((c) => (
				<Badge
					key={c.id}
					variant="secondary"
					className="gap-1 py-0.5 pl-1.5 pr-1 text-[11px]"
				>
					<span
						className="inline-block h-2 w-2 rounded-full"
						style={{ backgroundColor: c.color }}
					/>
					{c.name}
					<button
						type="button"
						onClick={() => onRemove(c.id)}
						className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
					>
						<X className="h-2.5 w-2.5" />
					</button>
				</Badge>
			))}
			{hiddenCount > 0 && (
				<Badge variant="outline" className="text-[11px]">
					+{hiddenCount} more
				</Badge>
			)}
		</div>
	);
}
