import type { APIRoute } from 'astro'
import { llmsIndex } from '../../lib/llms'

export const GET: APIRoute = () => new Response(llmsIndex('ko'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
