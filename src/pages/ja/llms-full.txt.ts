import type { APIRoute } from 'astro'
import { llmsFull } from '../../lib/llms'

export const GET: APIRoute = () => new Response(llmsFull('ja'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
