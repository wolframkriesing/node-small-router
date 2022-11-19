import http from "http";
import { Server } from "net";
import { ParsedUrlQuery } from "querystring";
import { Fields, Files } from "formidable";

type Parameters = { [key: string]: string };
type Request = http.IncomingMessage & { parameters: Parameters };

export type addRouteCB = (
    req: Request,
    res: http.ServerResponse,
    rawUrl: string,
    queryString: ParsedUrlQuery
) => void;
export type parseDataCB = (
    err: null | Error,
    fields: Fields,
    files: Files
) => void;

export class Router {
    prefix: string;
    constructor();
    addRoute(
        route: string | string[],
        cb: addRouteCB,
        method?: string
    ): boolean;
    addAssetPath(
        asset: string,
        path: string,
        overWrite?: boolean,
        stripFromPath?: string
    ): boolean;
    route(req: http.IncomingMessage, res: http.ServerResponse): void;
    listen(port: number, cb: typeof Server.listen): void;
    renderAsset(
        path: string,
        file: string,
        assetType: string,
        res: http.ServerResponse
    ): void;
    parseData(req: http.IncomingHttpHeaders, cb: parseDataCB): void;
    parseURLParameter(urlPart: string, routePart: string): string | false;
    pageNotFound(res: http.ServerResponse, url: string): void;
    close(): void;
    get(route: string | string[], cb: addRouteCB);
    post(route: string | string[], cb: addRouteCB);
    put(route: string | string[], cb: addRouteCB);
    delete(route: string | string[], cb: addRouteCB);
}

export default function smallRouter(http: typeof import("http")): Router;
