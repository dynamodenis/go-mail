import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";

const Dialog = BaseDialog.Root;
const DialogTrigger = BaseDialog.Trigger;
const DialogClose = BaseDialog.Close;
const DialogTitle = BaseDialog.Title;
const DialogDescription = BaseDialog.Description;

function DialogContent({
	className,
	children,
	...props
}: React.ComponentPropsWithoutRef<typeof BaseDialog.Popup> & {
	className?: string;
}) {
	return (
		<BaseDialog.Portal>
			<BaseDialog.Backdrop className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
			<BaseDialog.Popup
				className={cn(
					"fixed z-50 border bg-background shadow-lg transition-all duration-150",
					"inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg",
					"data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
					"data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
					className,
				)}
				{...props}
			>
				{children}
			</BaseDialog.Popup>
		</BaseDialog.Portal>
	);
}

export {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogDescription,
	DialogClose,
	DialogTrigger,
};
