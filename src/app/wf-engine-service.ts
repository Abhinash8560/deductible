import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders,HttpErrorResponse} from "@angular/common/http";
import {Observable,throwError  } from "rxjs";
import { map,retry,catchError } from 'rxjs/operators';
import {environment} from 'environments/environment';
import {productRequest  } from '../_models/product-request.model';
import { DoiCheckList } from '../_models/doicheckList.mode';
import {MatSnackBar} from '@angular/material/snack-bar';
import {user} from '../models';
import { ReturnStatement } from '@angular/compiler';
import { env } from 'node:process';

@Injectable({
  providedIn: 'root'
})
export class WfEngineService {

  httpOptions={
    Headers:new HttpHeaders({
     'Access-Control-Allow-Origin':'*',
     'Access-Control-Allow-Credentials':'true',
     'Access-Control-Allow-Headers':'Content-type',
     'Access-Control-Allow-Methods':'GET,PUT,POST,DELETE',
     'Content-Type':'application/json',
    })
  };
  constructor(private httpClient: HttpClient) { }
  getMngPrdReq(): Observable <any> {
    Return this.httpClient.get(environment.apiUrl+"/wfengine/requests").pipe(retry(1),catchError(this.handleError));
  }
  getProductNames(mode:string){
    return this.httpClient.get(environment.apiUrl+"/pengine/products?status="+mode).pipe(retry(1), catchError(this.handleError));
  }
  getMngDOIChecklist():Observable<any>{
    return this.httpClient.get(environment.apiUrl+"/wfengine/doi-checklists").pipe(retry(1), catchError(this.handleError));
  }
  handleError(error:HttpErrorResponse){
    let errorMessage ="please try after sometime!!';
    if(error.error instanceof ErrorEvent) {
      errorMessage =  `Error: $(error.error.message)`;
    }
    else if(error.status){
      errorMessage = `Error Code:${error.status}\nMessage: ${error.message}`;
    }
    window.alert(errorMessage);
    return throwError("please try after sometime!!!");
    }

}
