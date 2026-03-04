import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Contact } from "@/features/contacts/schemas/types";
import { useSearchContacts } from "../../api/queries";
import { Loader2, Search, User, Users, X } from "lucide-react";
import {
	useCallback,
	useDeferredValue,
	useEffect,
	useRef,
	useState,
} from "react";

interface ContactSearchSelectProps {
	selectedIds: string[];
	onChange: (ids: string[]) => void;
}

const SCROLL_THRESHOLD = 40;

export function ContactSearchSelect({
	selectedIds,
	onChange,
}: ContactSearchSelectProps) {
	const [search, setSearch] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const deferredSearch = useDeferredValue(search);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
	} = useSearchContacts(deferredSearch);

	const contacts = data?.contacts ?? [];
	const total = data?.total ?? 0;

	const toggleContact = useCallback(
		(contactId: string) => {
			onChange(
				selectedIds.includes(contactId)
					? selectedIds.filter((id) => id !== contactId)
					: [...selectedIds, contactId],
			);
		},
		[selectedIds, onChange],
	);

	const removeContact = useCallback(
		(contactId: string) => {
			onChange(selectedIds.filter((id) => id !== contactId));
		},
		[selectedIds, onChange],
	);

	const handleScroll = useCallback(() => {
		const el = dropdownRef.current;
		if (!el || !hasNextPage || isFetchingNextPage) return;
		const nearBottom =
			el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD;
		if (nearBottom) fetchNextPage();
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const selectedContacts = contacts.filter((c) =>
		selectedIds.includes(c.id),
	);

	const getDisplayName = (contact: Contact) => {
		if (contact.firstName || contact.lastName) {
			return [contact.firstName, contact.lastName].filter(Boolean).join(" ");
		}
		return contact.email.split("@")[0];
	};

	const getInitials = (contact: Contact) => {
		if (contact.firstName && contact.lastName) {
			return `${contact.firstName[0]}${contact.lastName[0]}`.toUpperCase();
		}
		if (contact.firstName) return contact.firstName[0].toUpperCase();
		return contact.email[0].toUpperCase();
	};

	return (
		<div ref={containerRef} className="space-y-2">
			{selectedIds.length > 0 && (
				<SelectedContactsBadges
					contacts={selectedContacts}
					allSelectedIds={selectedIds}
					getDisplayName={getDisplayName}
					onRemove={removeContact}
				/>
			)}

			<div className="relative">
				<div className="relative">
					<Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search contacts by name or email..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onFocus={() => setIsOpen(true)}
						className="pl-8 text-xs placeholder:text-xs"
					/>
				</div>

				{isOpen && (
					<div className="absolute z-50 mt-1.5 w-full rounded-lg border border-border bg-popover shadow-lg animate-in fade-in-0 slide-in-from-top-1">
						<div className="flex items-center justify-between border-b border-border px-3 py-2">
							<span className="text-xs text-muted-foreground">
								{total} contact{total !== 1 ? "s" : ""} found
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
										Searching contacts...
									</span>
								</div>
							) : contacts.length === 0 ? (
								<div className="flex flex-col items-center gap-1.5 py-8">
									<Users className="h-5 w-5 text-muted-foreground/50" />
									<span className="text-xs text-muted-foreground">
										{search
											? "No contacts match your search"
											: "No contacts found"}
									</span>
								</div>
							) : (
								<div className="p-1.5">
									{contacts.map((contact) => (
										<ContactCard
											key={contact.id}
											contact={contact}
											isSelected={selectedIds.includes(contact.id)}
											getDisplayName={getDisplayName}
											getInitials={getInitials}
											onToggle={toggleContact}
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
				)}
			</div>
		</div>
	);
}

function ContactCard({
	contact,
	isSelected,
	getDisplayName,
	getInitials,
	onToggle,
}: {
	contact: Contact;
	isSelected: boolean;
	getDisplayName: (c: Contact) => string;
	getInitials: (c: Contact) => string;
	onToggle: (id: string) => void;
}) {
	return (
		<button
			type="button"
			onClick={() => onToggle(contact.id)}
			className={cn(
				"flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors",
				isSelected
					? "bg-primary/8 ring-1 ring-primary/20"
					: "hover:bg-accent/50",
			)}
		>
			<div
				className={cn(
					"flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium",
					isSelected
						? "bg-primary text-primary-foreground"
						: "bg-muted text-muted-foreground",
				)}
			>
				{isSelected ? (
					<User className="h-3.5 w-3.5" />
				) : (
					getInitials(contact)
				)}
			</div>

			<div className="min-w-0 flex-1">
				<p className="truncate text-xs font-medium">
					{getDisplayName(contact)}
				</p>
				<p className="truncate text-[11px] text-muted-foreground">
					{contact.email}
				</p>
			</div>

			<Checkbox
				checked={isSelected}
				onCheckedChange={() => onToggle(contact.id)}
				onClick={(e) => e.stopPropagation()}
				className="shrink-0"
			/>
		</button>
	);
}

function SelectedContactsBadges({
	contacts,
	allSelectedIds,
	getDisplayName,
	onRemove,
}: {
	contacts: Contact[];
	allSelectedIds: string[];
	getDisplayName: (c: Contact) => string;
	onRemove: (id: string) => void;
}) {
	const hiddenCount = allSelectedIds.length - contacts.length;

	return (
		<div className="flex flex-wrap items-center gap-1.5">
			{contacts.map((contact) => (
				<Badge
					key={contact.id}
					variant="secondary"
					className="gap-1 py-0.5 pl-2 pr-1 text-[11px]"
				>
					{getDisplayName(contact)}
					<button
						type="button"
						onClick={() => onRemove(contact.id)}
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
