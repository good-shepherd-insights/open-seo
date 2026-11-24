import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DragDropProvider,
  KeyboardSensor,
  PointerSensor,
} from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { toast } from "sonner";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { GripVertical } from "lucide-react";
import {
  getOverviewCardOrder,
  saveOverviewCardOrder,
} from "@/serverFunctions/dashboard";
import {
  overviewCardIdSchema,
  type OverviewCardId,
} from "@/types/schemas/dashboard";
import {
  mergeOverviewCardOrder,
  orderOverviewCards,
} from "./overviewCardOrder";

export type OverviewCard = {
  key: OverviewCardId;
  hasData: boolean;
  node: ReactNode;
};

const CARD_NAMES: Record<OverviewCardId, string> = {
  newQueries: "New keywords",
  gsc: "Google Search Console",
  ga4: "Google Analytics",
  audit: "Site health",
  backlinks: "New backlinks",
};

// The whole card still drags; the handle shows that it can.
const sensors = [
  PointerSensor.configure({ activatorElements: (source) => [source.element] }),
  KeyboardSensor,
];

const ARROW_STEPS: Record<string, number | undefined> = {
  ArrowUp: -1,
  ArrowLeft: -1,
  ArrowDown: 1,
  ArrowRight: 1,
};

function SortableCard({
  card,
  index,
  disabled,
  onMove,
}: {
  card: OverviewCard;
  index: number;
  disabled: boolean;
  onMove: (step: number) => boolean;
}) {
  const { ref, handleRef, isDragging } = useSortable({
    id: card.key,
    index,
    disabled,
  });
  const button = useRef<HTMLButtonElement | null>(null);
  const refocus = useRef(false);
  // Moving the card in the page drops focus from the handle that moved it.
  useEffect(() => {
    if (refocus.current) button.current?.focus();
    refocus.current = false;
  }, [index]);
  return (
    <div
      ref={ref}
      className="relative min-w-0 [&_[data-slot=card-header]]:pl-12 max-sm:[&_[data-slot=card-title]]:flex-nowrap"
    >
      {card.node}
      <button
        ref={(element) => {
          button.current = element;
          handleRef(element);
        }}
        type="button"
        aria-label={`Move ${CARD_NAMES[card.key]}`}
        title="Drag the card, or use the arrow keys"
        className="absolute top-3.5 left-1.5 flex size-11 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 active:cursor-grabbing"
        onKeyDown={(event) => {
          const step = ARROW_STEPS[event.key];
          if (!step || isDragging) return;
          event.preventDefault();
          refocus.current = onMove(step);
        }}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export function OverviewCardGrid({
  projectId,
  cards,
}: {
  projectId: string;
  cards: OverviewCard[];
}) {
  const [moved, setMoved] = useState("");
  const queryClient = useQueryClient();
  const queryKey = ["overviewCardOrder", projectId] as const;
  const orderQuery = useQuery({
    queryKey,
    queryFn: () => getOverviewCardOrder({ data: { projectId } }),
  });
  const save = useMutation({
    mutationFn: (order: OverviewCardId[]) =>
      saveOverviewCardOrder({ data: { projectId, order } }),
    onMutate: async (order) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<OverviewCardId[] | null>(
        queryKey,
      );
      queryClient.setQueryData(queryKey, order);
      return { previous };
    },
    onError: (_error, _order, context) => {
      queryClient.setQueryData(queryKey, context?.previous ?? null);
      toast.error("Could not save your card order. Please try again.");
    },
    onSuccess: ({ order }) => queryClient.setQueryData(queryKey, order),
  });

  const ordered = orderOverviewCards(cards, orderQuery.data ?? null);
  const visibleIds = ordered.map((card) => card.key);
  const completeOrder = [
    ...visibleIds,
    ...overviewCardIdSchema.options.filter((id) => !visibleIds.includes(id)),
  ];

  const moveCard = (from: number, to: number) => {
    const next = [...visibleIds];
    next.splice(to, 0, ...next.splice(from, 1));
    save.mutate(mergeOverviewCardOrder(orderQuery.data ?? completeOrder, next));
  };

  if (orderQuery.isPending) {
    return (
      <div className="grid gap-5 lg:grid-cols-2" aria-busy>
        {ordered.map((card) => (
          <div
            key={card.key}
            className="[&_[data-slot=card-header]]:pl-12 max-sm:[&_[data-slot=card-title]]:flex-nowrap"
          >
            {card.node}
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropProvider
      sensors={sensors}
      onDragEnd={(event) => {
        if (event.canceled || save.isPending) return;
        const { source } = event.operation;
        if (!isSortable(source) || source.initialIndex === source.index) return;
        moveCard(source.initialIndex, source.index);
      }}
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {ordered.map((card, index) => (
          <SortableCard
            key={card.key}
            card={card}
            index={index}
            disabled={save.isPending || orderQuery.isError}
            onMove={(step) => {
              const to = index + step;
              if (save.isPending || orderQuery.isError || !ordered[to])
                return false;
              moveCard(index, to);
              setMoved(
                `${CARD_NAMES[card.key]} moved to position ${to + 1} of ${ordered.length}.`,
              );
              return true;
            }}
          />
        ))}
      </div>
      <p role="status" className="sr-only">
        {moved}
      </p>
    </DragDropProvider>
  );
}
