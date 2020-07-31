import http, { Server } from 'http'
import { ParsedUrlQuery } from 'querystring';
import { Fields, Files } from 'formidable'

export function addRouteCB(req: http.IncomingMessage, res: http.ServerResponse, rawUrl: string, queryString: ParsedUrlQuery): void;
export function parseDataCB(err: null | Error, fields: Fields, files: Files)

export class Router {
    constructor(): void;
    addRoute(route: string, cb: addRouteCB): boolean;
    addAssetPath(asset: string, path: string, overWrite: boolean): boolean;
    route(req: http.IncomingMessage, res: http.ServerResponse): void;
    listen(port: number, cb: typeof Server.listen): void;
    renderAsset(path: string, file: string, assetType: string, res: http.ServerResponse): void;
    parseData(req: http.IncomingHttpHeaders, cb: parseDataCB): void;
    parseURLParameter(urlPart: string, routePart: string): string | false;
    pageNotFound(res: http.ServerResponse, url: string): void;
    close(): void;
}

export default function smallRouter(http: typeof import('http')): Router;
