"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const CART_STORAGE_KEY =
  "afriskill-ai:cart:v1";

const MAX_CART_ITEMS = 50;

export type CartItem = {
  courseId: string;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  isHydrated: boolean;
  addCourse: (courseId: string) => void;
  removeCourse: (courseId: string) => void;
  toggleCourse: (courseId: string) => void;
  hasCourse: (courseId: string) => boolean;
  clearCart: () => void;
};

const CartContext =
  createContext<CartContextValue | null>(null);

type CartProviderProps = Readonly<{
  children: ReactNode;
}>;

/**
 * Valide et normalise un identifiant de formation.
 *
 * Le panier ne conserve que des identifiants simples
 * correspondant au format actuellement utilisé par
 * AfriSkill AI.
 */
function normalizeCourseId(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const courseId = value.trim();

  if (!courseId) {
    return null;
  }

  if (courseId.length > 191) {
    return null;
  }

  if (
    !/^[a-zA-Z0-9_-]+$/.test(courseId)
  ) {
    return null;
  }

  return courseId;
}

/**
 * Nettoie une valeur provenant du stockage local.
 *
 * Sécurités :
 * - refuse les données non conformes ;
 * - supprime les doublons ;
 * - valide chaque courseId ;
 * - limite le panier à 50 éléments.
 */
function sanitizeStoredCart(
  value: unknown,
): CartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const uniqueCourseIds =
    new Set<string>();

  for (const entry of value) {
    if (
      typeof entry !== "object" ||
      entry === null ||
      !("courseId" in entry)
    ) {
      continue;
    }

    const courseId = normalizeCourseId(
      (
        entry as {
          courseId?: unknown;
        }
      ).courseId,
    );

    if (!courseId) {
      continue;
    }

    uniqueCourseIds.add(courseId);

    if (
      uniqueCourseIds.size >=
      MAX_CART_ITEMS
    ) {
      break;
    }
  }

  return Array.from(
    uniqueCourseIds,
  ).map((courseId) => ({
    courseId,
  }));
}

/**
 * Lit le panier depuis localStorage.
 *
 * Cette fonction n'est utilisée que côté navigateur.
 */
function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue =
      window.localStorage.getItem(
        CART_STORAGE_KEY,
      );

    if (!rawValue) {
      return [];
    }

    const parsedValue: unknown =
      JSON.parse(rawValue);

    return sanitizeStoredCart(
      parsedValue,
    );
  } catch {
    return [];
  }
}

/**
 * Enregistre le panier dans localStorage.
 *
 * Une erreur de stockage ne doit jamais casser
 * l'interface : le panier continue alors de
 * fonctionner en mémoire pendant la session.
 */
function writeStoredCart(
  items: CartItem[],
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(items),
    );
  } catch {
    // Le panier reste disponible en mémoire.
  }
}

/**
 * Permet de savoir si React est actuellement
 * exécuté côté navigateur sans déclencher de
 * setState dans un useEffect.
 *
 * Cela remplace l'ancien :
 *
 * useEffect(() => {
 *   setIsHydrated(true);
 * }, []);
 */
function subscribeToHydration(): () => void {
  return () => {};
}

function getClientHydrationSnapshot(): boolean {
  return true;
}

function getServerHydrationSnapshot(): boolean {
  return false;
}

export function CartProvider({
  children,
}: CartProviderProps) {
  /**
   * L'état initial côté serveur reste vide afin
   * de garantir un rendu SSR déterministe.
   *
   * Dès que React passe côté navigateur,
   * useSyncExternalStore nous indique que
   * l'hydratation est terminée.
   */
  const isHydrated =
    useSyncExternalStore(
      subscribeToHydration,
      getClientHydrationSnapshot,
      getServerHydrationSnapshot,
    );

  const [items, setItems] =
    useState<CartItem[]>(() => {
      /*
       * Pendant le SSR, window n'existe pas et
       * readStoredCart() retourne simplement [].
       *
       * Lors d'un rendu purement client, cette
       * initialisation peut immédiatement récupérer
       * le panier existant.
       */
      return readStoredCart();
    });

  /**
   * Après hydratation, le panier mémorisé est
   * récupéré via une tâche asynchrone.
   *
   * Le setState n'est donc pas exécuté
   * synchroniquement dans le corps du useEffect.
   */
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const timeoutId =
      window.setTimeout(() => {
        setItems(readStoredCart());
      }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isHydrated]);

  /**
   * Persistance du panier.
   *
   * On ne touche pas au stockage avant que
   * l'hydratation du composant soit terminée.
   */
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    writeStoredCart(items);
  }, [items, isHydrated]);

  /**
   * Synchronisation entre plusieurs onglets
   * ou fenêtres du navigateur.
   *
   * L'événement "storage" est déclenché lorsque
   * localStorage est modifié depuis un autre
   * contexte navigateur.
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorage = (
      event: StorageEvent,
    ) => {
      if (
        event.key !== CART_STORAGE_KEY
      ) {
        return;
      }

      if (!event.newValue) {
        setItems([]);
        return;
      }

      try {
        const parsedValue: unknown =
          JSON.parse(event.newValue);

        setItems(
          sanitizeStoredCart(
            parsedValue,
          ),
        );
      } catch {
        setItems([]);
      }
    };

    window.addEventListener(
      "storage",
      handleStorage,
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage,
      );
    };
  }, []);

  /**
   * Ajoute une formation au panier.
   */
  const addCourse = useCallback(
    (rawCourseId: string) => {
      const courseId =
        normalizeCourseId(
          rawCourseId,
        );

      if (!courseId) {
        return;
      }

      setItems((currentItems) => {
        const alreadyExists =
          currentItems.some(
            (item) =>
              item.courseId ===
              courseId,
          );

        if (alreadyExists) {
          return currentItems;
        }

        if (
          currentItems.length >=
          MAX_CART_ITEMS
        ) {
          return currentItems;
        }

        return [
          ...currentItems,
          {
            courseId,
          },
        ];
      });
    },
    [],
  );

  /**
   * Retire une formation du panier.
   */
  const removeCourse = useCallback(
    (rawCourseId: string) => {
      const courseId =
        normalizeCourseId(
          rawCourseId,
        );

      if (!courseId) {
        return;
      }

      setItems((currentItems) =>
        currentItems.filter(
          (item) =>
            item.courseId !== courseId,
        ),
      );
    },
    [],
  );

  /**
   * Ajoute ou retire une formation selon
   * sa présence actuelle dans le panier.
   */
  const toggleCourse = useCallback(
    (rawCourseId: string) => {
      const courseId =
        normalizeCourseId(
          rawCourseId,
        );

      if (!courseId) {
        return;
      }

      setItems((currentItems) => {
        const alreadyExists =
          currentItems.some(
            (item) =>
              item.courseId ===
              courseId,
          );

        if (alreadyExists) {
          return currentItems.filter(
            (item) =>
              item.courseId !==
              courseId,
          );
        }

        if (
          currentItems.length >=
          MAX_CART_ITEMS
        ) {
          return currentItems;
        }

        return [
          ...currentItems,
          {
            courseId,
          },
        ];
      });
    },
    [],
  );

  /**
   * Vérifie si une formation est déjà
   * présente dans le panier.
   */
  const hasCourse = useCallback(
    (rawCourseId: string): boolean => {
      const courseId =
        normalizeCourseId(
          rawCourseId,
        );

      if (!courseId) {
        return false;
      }

      return items.some(
        (item) =>
          item.courseId === courseId,
      );
    },
    [items],
  );

  /**
   * Vide entièrement le panier.
   */
  const clearCart =
    useCallback(() => {
      setItems([]);
    }, []);

  const value =
    useMemo<CartContextValue>(
      () => ({
        items,
        itemCount: items.length,
        isHydrated,
        addCourse,
        removeCourse,
        toggleCourse,
        hasCourse,
        clearCart,
      }),
      [
        items,
        isHydrated,
        addCourse,
        removeCourse,
        toggleCourse,
        hasCourse,
        clearCart,
      ],
    );

  return (
    <CartContext.Provider
      value={value}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart doit être utilisé à l'intérieur de CartProvider.",
    );
  }

  return context;
}