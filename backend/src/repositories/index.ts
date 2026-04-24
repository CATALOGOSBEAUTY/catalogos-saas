import { env } from '../config/env.js';
import { MemoryCatalogRepository, type CatalogRepository } from '../store/data.js';
import { SupabaseCatalogRepository } from './supabaseRepository.js';

let repository: CatalogRepository | null = null;

export function getRepository(): CatalogRepository {
  if (repository) return repository;

  if (env.dataProvider === 'supabase') {
    repository = new SupabaseCatalogRepository();
    return repository;
  }

  repository = new MemoryCatalogRepository();
  return repository;
}

export function setRepositoryForTests(nextRepository: CatalogRepository | null): void {
  repository = nextRepository;
}
