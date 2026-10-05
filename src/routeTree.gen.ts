/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as FinanceRouteImport } from './routes/finance'
import { Route as GithubReadingRoomRouteImport } from './routes/github-reading-room'
import { Route as MovementRouteImport } from './routes/movement'
import { Route as OversightRouteImport } from './routes/oversight'
import { Route as PrivacyRouteImport } from './routes/privacy'
import { Route as ReadingRoomRouteImport } from './routes/reading-room'
import { Route as RecordsIdRouteImport } from './routes/records.$id'
import { Route as RecordsRouteImport } from './routes/records'
import { Route as SignalRouteImport } from './routes/signal'
import { Route as SourcesRouteImport } from './routes/sources'
import { Route as TitanRouteImport } from './routes/titan'
import { Route as ToolkitRouteImport } from './routes/toolkit'
import { Route as VeilRouteImport } from './routes/veil'
import { Route as WatchtowerRouteImport } from './routes/watchtower'
import { Route as AlprDataRouteImport } from './routes/api/civint/alpr/data'
import { Route as FinanceFederalRouteImport } from './routes/api/civint/finance/federal'
import { Route as FinanceSecRouteImport } from './routes/api/civint/finance/sec'
import { Route as GithubRepositoryRouteImport } from './routes/api/civint/github/repository'
import { Route as LegislationCongressRouteImport } from './routes/api/civint/legislation/congress'
import { Route as LocationContextRouteImport } from './routes/api/civint/location/context'
import { Route as OversightFoiaRouteImport } from './routes/api/civint/oversight/foia'
import { Route as RecordsIdApiRouteImport } from './routes/api/civint/records/$id'
import { Route as RecordsSearchRouteImport } from './routes/api/civint/records/search'
import { Route as CivintSourcesRouteImport } from './routes/api/civint/sources'

const IndexRoute = IndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const FinanceRoute = FinanceRouteImport.update({ id: '/finance', path: '/finance', getParentRoute: () => rootRouteImport } as any)
const GithubReadingRoomRoute = GithubReadingRoomRouteImport.update({ id: '/github-reading-room', path: '/github-reading-room', getParentRoute: () => rootRouteImport } as any)
const MovementRoute = MovementRouteImport.update({ id: '/movement', path: '/movement', getParentRoute: () => rootRouteImport } as any)
const OversightRoute = OversightRouteImport.update({ id: '/oversight', path: '/oversight', getParentRoute: () => rootRouteImport } as any)
const PrivacyRoute = PrivacyRouteImport.update({ id: '/privacy', path: '/privacy', getParentRoute: () => rootRouteImport } as any)
const ReadingRoomRoute = ReadingRoomRouteImport.update({ id: '/reading-room', path: '/reading-room', getParentRoute: () => rootRouteImport } as any)
const RecordsIdRoute = RecordsIdRouteImport.update({ id: '/records/$id', path: '/records/$id', getParentRoute: () => rootRouteImport } as any)
const RecordsRoute = RecordsRouteImport.update({ id: '/records', path: '/records', getParentRoute: () => rootRouteImport } as any)
const SignalRoute = SignalRouteImport.update({ id: '/signal', path: '/signal', getParentRoute: () => rootRouteImport } as any)
const SourcesRoute = SourcesRouteImport.update({ id: '/sources', path: '/sources', getParentRoute: () => rootRouteImport } as any)
const TitanRoute = TitanRouteImport.update({ id: '/titan', path: '/titan', getParentRoute: () => rootRouteImport } as any)
const ToolkitRoute = ToolkitRouteImport.update({ id: '/toolkit', path: '/toolkit', getParentRoute: () => rootRouteImport } as any)
const VeilRoute = VeilRouteImport.update({ id: '/veil', path: '/veil', getParentRoute: () => rootRouteImport } as any)
const WatchtowerRoute = WatchtowerRouteImport.update({ id: '/watchtower', path: '/watchtower', getParentRoute: () => rootRouteImport } as any)
const AlprDataRoute = AlprDataRouteImport.update({ id: '/api/civint/alpr/data', path: '/api/civint/alpr/data', getParentRoute: () => rootRouteImport } as any)
const FinanceFederalRoute = FinanceFederalRouteImport.update({ id: '/api/civint/finance/federal', path: '/api/civint/finance/federal', getParentRoute: () => rootRouteImport } as any)
const FinanceSecRoute = FinanceSecRouteImport.update({ id: '/api/civint/finance/sec', path: '/api/civint/finance/sec', getParentRoute: () => rootRouteImport } as any)
const GithubRepositoryRoute = GithubRepositoryRouteImport.update({ id: '/api/civint/github/repository', path: '/api/civint/github/repository', getParentRoute: () => rootRouteImport } as any)
const LegislationCongressRoute = LegislationCongressRouteImport.update({ id: '/api/civint/legislation/congress', path: '/api/civint/legislation/congress', getParentRoute: () => rootRouteImport } as any)
const LocationContextRoute = LocationContextRouteImport.update({ id: '/api/civint/location/context', path: '/api/civint/location/context', getParentRoute: () => rootRouteImport } as any)
const OversightFoiaRoute = OversightFoiaRouteImport.update({ id: '/api/civint/oversight/foia', path: '/api/civint/oversight/foia', getParentRoute: () => rootRouteImport } as any)
const RecordsIdApiRoute = RecordsIdApiRouteImport.update({ id: '/api/civint/records/$id', path: '/api/civint/records/$id', getParentRoute: () => rootRouteImport } as any)
const RecordsSearchRoute = RecordsSearchRouteImport.update({ id: '/api/civint/records/search', path: '/api/civint/records/search', getParentRoute: () => rootRouteImport } as any)
const CivintSourcesRoute = CivintSourcesRouteImport.update({ id: '/api/civint/sources', path: '/api/civint/sources', getParentRoute: () => rootRouteImport } as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/finance': typeof FinanceRoute
  '/github-reading-room': typeof GithubReadingRoomRoute
  '/movement': typeof MovementRoute
  '/oversight': typeof OversightRoute
  '/privacy': typeof PrivacyRoute
  '/reading-room': typeof ReadingRoomRoute
  '/records/$id': typeof RecordsIdRoute
  '/records': typeof RecordsRoute
  '/signal': typeof SignalRoute
  '/sources': typeof SourcesRoute
  '/titan': typeof TitanRoute
  '/toolkit': typeof ToolkitRoute
  '/veil': typeof VeilRoute
  '/watchtower': typeof WatchtowerRoute
  '/api/civint/alpr/data': typeof AlprDataRoute
  '/api/civint/finance/federal': typeof FinanceFederalRoute
  '/api/civint/finance/sec': typeof FinanceSecRoute
  '/api/civint/github/repository': typeof GithubRepositoryRoute
  '/api/civint/legislation/congress': typeof LegislationCongressRoute
  '/api/civint/location/context': typeof LocationContextRoute
  '/api/civint/oversight/foia': typeof OversightFoiaRoute
  '/api/civint/records/$id': typeof RecordsIdApiRoute
  '/api/civint/records/search': typeof RecordsSearchRoute
  '/api/civint/sources': typeof CivintSourcesRoute
}
export interface FileRoutesByTo extends FileRoutesByFullPath {}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/finance': typeof FinanceRoute
  '/github-reading-room': typeof GithubReadingRoomRoute
  '/movement': typeof MovementRoute
  '/oversight': typeof OversightRoute
  '/privacy': typeof PrivacyRoute
  '/reading-room': typeof ReadingRoomRoute
  '/records/$id': typeof RecordsIdRoute
  '/records': typeof RecordsRoute
  '/signal': typeof SignalRoute
  '/sources': typeof SourcesRoute
  '/titan': typeof TitanRoute
  '/toolkit': typeof ToolkitRoute
  '/veil': typeof VeilRoute
  '/watchtower': typeof WatchtowerRoute
  '/api/civint/alpr/data': typeof AlprDataRoute
  '/api/civint/finance/federal': typeof FinanceFederalRoute
  '/api/civint/finance/sec': typeof FinanceSecRoute
  '/api/civint/github/repository': typeof GithubRepositoryRoute
  '/api/civint/legislation/congress': typeof LegislationCongressRoute
  '/api/civint/location/context': typeof LocationContextRoute
  '/api/civint/oversight/foia': typeof OversightFoiaRoute
  '/api/civint/records/$id': typeof RecordsIdApiRoute
  '/api/civint/records/search': typeof RecordsSearchRoute
  '/api/civint/sources': typeof CivintSourcesRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/finance' | '/github-reading-room' | '/movement' | '/oversight' | '/privacy' | '/reading-room' | '/records/$id' | '/records' | '/signal' | '/sources' | '/titan' | '/toolkit' | '/veil' | '/watchtower' | '/api/civint/alpr/data' | '/api/civint/finance/federal' | '/api/civint/finance/sec' | '/api/civint/github/repository' | '/api/civint/legislation/congress' | '/api/civint/location/context' | '/api/civint/oversight/foia' | '/api/civint/records/$id' | '/api/civint/records/search' | '/api/civint/sources'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/finance' | '/github-reading-room' | '/movement' | '/oversight' | '/privacy' | '/reading-room' | '/records/$id' | '/records' | '/signal' | '/sources' | '/titan' | '/toolkit' | '/veil' | '/watchtower' | '/api/civint/alpr/data' | '/api/civint/finance/federal' | '/api/civint/finance/sec' | '/api/civint/github/repository' | '/api/civint/legislation/congress' | '/api/civint/location/context' | '/api/civint/oversight/foia' | '/api/civint/records/$id' | '/api/civint/records/search' | '/api/civint/sources'
  id: '__root__' | '/' | '/finance' | '/github-reading-room' | '/movement' | '/oversight' | '/privacy' | '/reading-room' | '/records/$id' | '/records' | '/signal' | '/sources' | '/titan' | '/toolkit' | '/veil' | '/watchtower' | '/api/civint/alpr/data' | '/api/civint/finance/federal' | '/api/civint/finance/sec' | '/api/civint/github/repository' | '/api/civint/legislation/congress' | '/api/civint/location/context' | '/api/civint/oversight/foia' | '/api/civint/records/$id' | '/api/civint/records/search' | '/api/civint/sources'
  fileRoutesById: FileRoutesById
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': { id: '/'; path: '/'; fullPath: '/'; preLoaderRoute: typeof IndexRouteImport; parentRoute: typeof rootRouteImport }
    '/finance': { id: '/finance'; path: '/finance'; fullPath: '/finance'; preLoaderRoute: typeof FinanceRouteImport; parentRoute: typeof rootRouteImport }
    '/github-reading-room': { id: '/github-reading-room'; path: '/github-reading-room'; fullPath: '/github-reading-room'; preLoaderRoute: typeof GithubReadingRoomRouteImport; parentRoute: typeof rootRouteImport }
    '/movement': { id: '/movement'; path: '/movement'; fullPath: '/movement'; preLoaderRoute: typeof MovementRouteImport; parentRoute: typeof rootRouteImport }
    '/oversight': { id: '/oversight'; path: '/oversight'; fullPath: '/oversight'; preLoaderRoute: typeof OversightRouteImport; parentRoute: typeof rootRouteImport }
    '/privacy': { id: '/privacy'; path: '/privacy'; fullPath: '/privacy'; preLoaderRoute: typeof PrivacyRouteImport; parentRoute: typeof rootRouteImport }
    '/reading-room': { id: '/reading-room'; path: '/reading-room'; fullPath: '/reading-room'; preLoaderRoute: typeof ReadingRoomRouteImport; parentRoute: typeof rootRouteImport }
    '/records/$id': { id: '/records/$id'; path: '/records/$id'; fullPath: '/records/$id'; preLoaderRoute: typeof RecordsIdRouteImport; parentRoute: typeof rootRouteImport }
    '/records': { id: '/records'; path: '/records'; fullPath: '/records'; preLoaderRoute: typeof RecordsRouteImport; parentRoute: typeof rootRouteImport }
    '/signal': { id: '/signal'; path: '/signal'; fullPath: '/signal'; preLoaderRoute: typeof SignalRouteImport; parentRoute: typeof rootRouteImport }
    '/sources': { id: '/sources'; path: '/sources'; fullPath: '/sources'; preLoaderRoute: typeof SourcesRouteImport; parentRoute: typeof rootRouteImport }
    '/titan': { id: '/titan'; path: '/titan'; fullPath: '/titan'; preLoaderRoute: typeof TitanRouteImport; parentRoute: typeof rootRouteImport }
    '/toolkit': { id: '/toolkit'; path: '/toolkit'; fullPath: '/toolkit'; preLoaderRoute: typeof ToolkitRouteImport; parentRoute: typeof rootRouteImport }
    '/veil': { id: '/veil'; path: '/veil'; fullPath: '/veil'; preLoaderRoute: typeof VeilRouteImport; parentRoute: typeof rootRouteImport }
    '/watchtower': { id: '/watchtower'; path: '/watchtower'; fullPath: '/watchtower'; preLoaderRoute: typeof WatchtowerRouteImport; parentRoute: typeof rootRouteImport }
  }
}

const rootRouteChildren = {
  IndexRoute,
  FinanceRoute,
  GithubReadingRoomRoute,
  MovementRoute,
  OversightRoute,
  PrivacyRoute,
  ReadingRoomRoute,
  RecordsIdRoute,
  RecordsRoute,
  SignalRoute,
  SourcesRoute,
  TitanRoute,
  ToolkitRoute,
  VeilRoute,
  WatchtowerRoute,
  AlprDataRoute,
  FinanceFederalRoute,
  FinanceSecRoute,
  GithubRepositoryRoute,
  LegislationCongressRoute,
  LocationContextRoute,
  OversightFoiaRoute,
  RecordsIdApiRoute,
  RecordsSearchRoute,
  CivintSourcesRoute,
}
export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren as any)._addFileTypes<FileRouteTypes>()

import type { getRouter } from './router.tsx'
import type { createStart } from '@tanstack/react-start'
declare module '@tanstack/react-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>
  }
}
