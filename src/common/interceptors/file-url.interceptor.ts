import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class FileUrlInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    // 動態取得當前伺服器網址 (例如 http://localhost:3000)
    const protocol = request.protocol;
    const host = request.get('host');
    const baseUrl = `${protocol}://${host}`;

    return next.handle().pipe(map(data => this.transform(data, baseUrl)));
  }

  private transform(data: any, baseUrl: string): any {
    if (!data || typeof data !== 'object') return data;

    // 如果是陣列（如 findAll 的結果），遞迴處理
    if (Array.isArray(data)) {
      return data.map(item => this.transform(item, baseUrl));
    }

    // 處理分頁包裝格式
    if (data.data && Array.isArray(data.data)) {
      return { ...data, data: this.transform(data.data, baseUrl) };
    }

    // 真正的轉換邏輯：將 public/ 替換為 URL
    const newItem = { ...data };

    if (newItem.cover && typeof newItem.cover === 'string') {
      newItem.cover = this.formatUrl(newItem.cover, baseUrl);
    }

    if (newItem.images && Array.isArray(newItem.images)) {
      newItem.images = newItem.images.map(img => this.formatUrl(img, baseUrl));
    }

    return newItem;
  }

  private formatUrl(path: string, baseUrl: string): string {
    if (!path || path.startsWith('http')) return path;
    // 將 'public/uploads/products/xxx.jpg' 轉為 'http://localhost:3000/uploads/products/xxx.jpg'
    const urlPath = path.replace(/^public\//, '');
    
    return `${baseUrl}/${urlPath}`;
  }
}
