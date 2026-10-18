import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { toast } from "sonner";
import type { ReactNode } from "react";
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

function SortableCard({
  card,
  index,
  disabled,
}: {
  card: OverviewCard;
  index: number;
  disabled: boolean;
}) {
  const { ref } = useSortable({
    id: card.key,
    index,
    disabled,
  });
  return (
    <div ref={ref} className="min-w-0">
      {card.node}
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

  if (orderQuery.isPending) {
    return (
      <div className="grid gap-5 lg:grid-cols-2" aria-busy>
        {ordered.map((card) => (
          <div key={card.key}>{card.node}</div>
        ))}
      </div>
    );
  }

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled || save.isPending) return;
        const { source } = event.operation;
        if (!isSortable(source) || source.initialIndex === source.index) return;
        const next = [...visibleIds];
        const [moved] = next.splice(source.initialIndex, 1);
        next.splice(source.index, 0, moved);
        save.mutate(
          mergeOverviewCardOrder(orderQuery.data ?? completeOrder, next),
        );
      }}
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {ordered.map((card, index) => (
          <SortableCard
            key={card.key}
            card={card}
            index={index}
            disabled={save.isPending || orderQuery.isError}
          />
        ))}
      </div>
    </DragDropProvider>
  );
}
