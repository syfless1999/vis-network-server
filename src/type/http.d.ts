import { Request, Response } from 'express';
import { Node, Edge } from 'src/type/network'

type Controller = (req: Request, res: Response, next: (error: Error) => any) => Promise<unknown> | unknown;

// 服务端向数据源请求数据时的请求体结构
interface DataSourceRequest {
  nodeStart?: number // 所需节点的起点数
  nodeEnd?: number // 所需节点的终点数
  edgeStart?: number // 所需边的起点数
  edgeEnd?: number // 所需边的终点数
}
// 数据源向服务端返回数据时的返回体结构
interface DataSourceResponse {
  node: {
    data: Node[]; // 节点数组
    total: number; // 数据源的节点总数量
    end: number; // 此次请求返回的最后一个节点的位置
  }
  edge: {
    data: Edge[]; // 边数组
    total: number; // 数据源的边总数量
    end: number; // 此次请求返回的最后一条边的位置
  }
}