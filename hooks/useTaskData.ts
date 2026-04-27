'use client'

import useSWR from 'swr'
import { getTasks } from '@/app/actions/tasks'
import { getCategories } from '@/app/actions/categories'
import { getGoogleCalendarEvents } from '@/app/actions/google-calendar'
import type { Task, Category } from '@/types'
import type { GoogleCalendarEvent } from '@/lib/google-calendar'

type TaskFilter = Parameters<typeof getTasks>[0]

export function useTasks(filter?: TaskFilter) {
  const key = ['tasks', filter ? JSON.stringify(filter) : null]

  const { data, isLoading, mutate } = useSWR(key, () => getTasks(filter), {
    keepPreviousData: true,
    revalidateOnFocus: false,
    dedupingInterval: 3000,
  })

  return {
    tasks: (data ?? []) as Task[],
    isLoading: isLoading && !data,
    refresh: () => mutate(),
  }
}

export function useCategories() {
  const { data, mutate } = useSWR('categories', getCategories, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  })

  return {
    categories: (data ?? []) as Category[],
    refreshCategories: () => mutate(),
  }
}

export function useGoogleCalendarEvents(year: number, month: number) {
  const { data, isLoading, mutate } = useSWR(
    ['google-calendar-events', year, month],
    () => getGoogleCalendarEvents(year, month),
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    }
  )

  return {
    googleEvents: (data ?? []) as GoogleCalendarEvent[],
    isLoadingEvents: isLoading && !data,
    refreshEvents: () => mutate(),
  }
}
