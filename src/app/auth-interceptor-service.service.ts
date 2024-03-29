import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DecryptDataService } from './decrypt-data.service';
import { LoadingPageService } from './loading-page/loading-page.service';

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptorServiceService implements HttpInterceptor {
  url401 = '';
  reload = 0;
  constructor(private decryptService:DecryptDataService, private router: Router, private _snackBar: MatSnackBar,private _loadingService:LoadingPageService) { }
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this._loadingService.cambiarestadoloading(true);
    const token: string = sessionStorage.getItem("token")!;
    let request = req;
    return this.decryptService.encrypt(request).pipe(
      switchMap((encryptedBody) => {
        // Clonamos la solicitud original y le asignamos el cuerpo cifrado
        if(req.method === "GET" || req.method === "DELETE"){
          if (req.url.indexOf("?") > 0) {
            let encriptURL = req.url.substring(0, req.url.indexOf("?") + 1) +"data="+ encodeURIComponent(this.decryptService.encryptQuery(req.url.substring(req.url.indexOf("?") + 1, req.url.length)));
            if(token){
              request = req.clone({
                url: encriptURL,
                setHeaders: {
                  Authorization: 'Bearer ' + token
                }
            });
            }else{
              request = req.clone({
                url: encriptURL,   
            });
            }     
          }
        }else{
          if(token){
          const encryptedRequest = request.clone({ body: encryptedBody,setHeaders: {
            Authorization: 'Bearer ' + token
          } });
          return next.handle(encryptedRequest);
        }else{
          const encryptedRequest = request.clone({ body: encryptedBody });
          return next.handle(encryptedRequest);
        }
        }
        return next.handle(request);
      }),
      switchMap(async (event: HttpEvent<any>) => {
        if (event instanceof HttpResponse && event.ok) {
          try {
            const contentType = event.headers.get('Content-Type');
            this._loadingService.cambiarestadoloading(false);
            if (contentType && contentType.includes('application/json')) {
              const _body = await this.decryptService.decrypt(event).toPromise();
              const parsedBody = JSON.parse(_body);
              return event.clone({ body: parsedBody });
            }
          } catch (error) {
            console.error('Error during decryption or JSON parsing:', error);
            this._loadingService.cambiarestadoloading(false);
            return event;
          }
        }
        return event;
      }),
      catchError(error => {
        this._loadingService.cambiarestadoloading(false);
        if (error.status === 401 || error.status === 403) {
          if (this.url401 == request.url) {
            if (this.reload > 12) {
              this.reload = 0;
            } else {
              this.reload++;
            }

          } else {
            this.url401 = request.url;
            this.reload = 0;
          }
          sessionStorage.clear();
          this.router.navigateByUrl('');
          this.openSnackBar("Superó el tiempo limite de sesión.", "Ingrese Nuevamente");
        } else if (error.status === 500) {
          if (this.router.url === '/mantenedor') {
            this.router.navigateByUrl('');
          } else {
            this.router.navigateByUrl('');
          }
          this.openSnackBar("Hubo problemas, por favor comuniquese con Administrador.", "Reintente");
        } else if(error.status === 0){
          this.openSnackBar("Hubo problemas, por favor comuniquese con Administrador.", "Reintente");
        }else{
          return next.handle(request);
        }
        return throwError(error);
      })
    );
  }
  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action);
  }
}

