import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { LoadingPageService } from '../loading-page/loading-page.service';
import { LoginService } from './login.service';
import { FirebaseService } from '../shared-components/firebase.service';
import { DatePipe } from '@angular/common';
import { pairwise, takeUntil } from 'rxjs/operators';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  hide = true;
  errorMessages: Record<string, string> = {
    maxlength: 'Ingrese un maximo de caracteres',
    minlength: 'Ingrese un minimo de caracteres',
    email: 'Ingrese email válido',
    required: 'El campo es requerido',
    pattern: 'Ingrese caracteres válidos',
    notEquivalent: 'Contraseña deben ser iguales',
    passwordStrength: 'Contraseña debe contener Mayusculas,Minusculas,Numeros'
  };
  loginForm = new FormGroup({});
  crearCuentaForm = new FormGroup({});
  loginRequest: any = {};
  login = true;
  constructor(private datepipe:DatePipe, private firebaseService:FirebaseService, fb: FormBuilder, private loginService: LoginService, private router: Router, private loading: LoadingPageService, private _snackBar: MatSnackBar) {
    sessionStorage.clear();
    this.loginForm = fb.group(
      {
        usuario: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
        contrasena: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]]

      }
    );
    this.crearCuentaForm = fb.group(
      {
        usuario: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
        contrasena: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20),this.createPasswordStrengthValidator()]],
        nombre_completo: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(50)]],
        correo: ['', [Validators.email, Validators.required, Validators.minLength(6), Validators.maxLength(60)]],
        contrasenaRepetir: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20),this.ConfirmedValidator(),this.createPasswordStrengthValidator()]]
      },
    );
  }
  
  get usuarioCrear() { return this.crearCuentaForm.value.usuario }

  get contrasenaCrear() { return this.crearCuentaForm.value.contrasena; }

  get nombre_completoCrear() { return this.crearCuentaForm.value.nombre_completo }

  get correoCrear() { return this.crearCuentaForm.value.correo; }
  get contrasenaRepetirCrear() { return this.crearCuentaForm.value.contrasenaRepetir; }
  ConfirmedValidator():ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null  => {
      const value = group.value
      if (!value) {
        return null;
    }
          if (this.contrasenaCrear !== this.contrasenaRepetirCrear) {
            return {notEquivalent:true};
          } else {
            return null;
          }
    };
  }
  createPasswordStrengthValidator(): ValidatorFn {
    return (control:AbstractControl) : ValidationErrors | null => {

        const value = control.value;

        if (!value) {
            return null;
        }

        const hasUpperCase = /[A-Z]+/.test(value);

        const hasLowerCase = /[a-z]+/.test(value);

        const hasNumeric = /[0-9]+/.test(value);

        const passwordValid = hasUpperCase && hasLowerCase && hasNumeric;

        return !passwordValid ? {passwordStrength:true}: null;
    }
  }
  volver() {
    this.login = true;
  }
  nuevoUsuario() {
    this.login = false;
  }
  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action);
  }

  ngOnInit(): void {
    sessionStorage.clear();
    this.loading.cambiarestadoloading(false);
    
  }
  errors(control: AbstractControl | null): string[] {
    if(control === null){
      return [];
    }else{
      return control.errors ? Object.keys(control.errors) : [];
    }
  }
  get usuario() { return this.loginForm.value.usuario }

  get contrasena() { return this.loginForm.value.contrasena; }

  isValidInput(fieldName: string | number,form: FormGroup): boolean {
    return form.controls[fieldName]?.invalid &&
      (form.controls[fieldName].dirty || form.controls[fieldName].touched);
  }
  onSubmit(f: FormGroup) {
    if (f.valid) {
      //this.loading.cambiarestadoloading(true);
      const loginRequest = { Username: this.usuario, Password: this.contrasena };
      this.loginService.IniciarSesion(loginRequest).subscribe((datos) => {
        if (datos.Error !== undefined) {
          sessionStorage.clear();
          this.openSnackBar("Credenciales Inválidas.", "Reintente");
        } else {
          if (datos.access_Token.length > 0) {
            const hora = new Date().getHours() + ":"+new Date().getMinutes() + ":"+new Date().getSeconds();
            this.firebaseService.conexionFirebase(this.usuario,datos.access_Token,this.datepipe.transform(new Date(),"dd/MM/YYYY"),hora);
            this.loginService.enviaCondicion(true);
            this._snackBar.dismiss();
            sessionStorage.setItem('token', datos.access_Token);
            sessionStorage.setItem('user',this.usuario);
            this.router.navigateByUrl('/mantenedor');
          } else {
            this.loginService.enviaCondicion(false);
            sessionStorage.clear();
            this.openSnackBar("Hubo problemas para validar su usuario", "Reintente");
          }
        }
        console.log(datos);
      },(error) => {
        console.log(error);
        if(error.status !== 200){
          this.router.navigateByUrl('');
        }
      },() => {
        //this.loading.cambiarestadoloading(false);
      });
    }
  }
  CrearUsuario(f: FormGroup) {
    if (f.valid) {
      //this.loading.cambiarestadoloading(true);
      const loginRequest = { usuario: this.usuarioCrear, contrasena: this.contrasenaCrear, nombre_completo: this.nombre_completoCrear, correo: this.correoCrear };
      this.loginService.CrearUsuario(loginRequest).subscribe((datos) => {
        if (datos.Error !== undefined) {
          sessionStorage.clear();
          this.openSnackBar("Hubo problemas al crear su usuario Intente nuevamente.", "Reintente");
        } else {
          if (datos.datos === 'ok') {
            this.login = true;
            this.openSnackBar("Usuario creado exitosamente.", "Ok");
          } else {
            sessionStorage.clear();
            this.openSnackBar("Hubo problemas para validar su usuario", "Reintente");
          }
        }
        console.log(datos);
      },(error) => {
        console.log(error);
        if(error.status !== 200){
          this.router.navigateByUrl('');
        }
      },() => {
        //this.loading.cambiarestadoloading(false);
      });
    }
  }

}

