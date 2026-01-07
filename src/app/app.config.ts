import { Actions, EffectsModule } from "@ngrx/effects";
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from "@angular/common/http";
import {
  ApplicationConfig,
  importProvidersFrom,
  inject,
  provideAppInitializer,
} from "@angular/core";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from "@angular/router";

import { MAT_CARD_CONFIG } from "@angular/material/card";
import { MAT_DATE_LOCALE } from "@angular/material/core";
import { MatPaginatorIntl } from "@angular/material/paginator";
import { provideTranslateService, TranslateLoader } from "@ngx-translate/core";
import { provideToastr } from "ngx-toastr";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";

import {
  apiInterceptor,
  BASE_URL,
  baseUrlInterceptor,
  errorInterceptor,
  loggingInterceptor,
  noopInterceptor,
  settingsInterceptor,
  SettingsService,
  tokenInterceptor,
} from "@core";
import { environment } from "@env/environment";
import { PaginatorI18nService } from "@shared";
import { routes } from "./app.routes";
import { NgxPermissionsModule } from "ngx-permissions";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { StoreModule } from "@ngrx/store";
import { EventModule } from "@modules/events/event.module";
import { reducers, metaReducers } from "./reducers";
import { eventReducer } from "@modules/events/reducers/event.reducer";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { SharedModule } from "@shared/shared.module";
// Required for AOT compilation
function TranslateHttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, "i18n/", ".json");
}

// Http interceptor providers in outside-in order
const interceptors = [
  noopInterceptor,
  baseUrlInterceptor,
  settingsInterceptor,
  tokenInterceptor,
  apiInterceptor,
  errorInterceptor,
  loggingInterceptor,
];

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: BASE_URL, useValue: environment.baseUrl },
    importProvidersFrom(
      Actions,
      EventModule,
      SharedModule,
      FormsModule,
      MatFormFieldModule,
      MatInputModule,
      MatIconModule,
      NgxPermissionsModule.forRoot(),
      ReactiveFormsModule,
      StoreModule.forRoot({ nf: eventReducer }),
    ),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors(interceptors)),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: "enabled",
        anchorScrolling: "enabled",
      }),
      withComponentInputBinding(),
    ),
    provideToastr(),
    provideTranslateService({
      loader: {
        provide: TranslateLoader,
        useFactory: TranslateHttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    {
      provide: MatPaginatorIntl,
      useFactory: (paginatorI18nSrv: PaginatorI18nService) =>
        paginatorI18nSrv.getPaginatorIntl(),
      deps: [PaginatorI18nService],
    },
    {
      provide: MAT_DATE_LOCALE,
      useFactory: () => inject(SettingsService).getLocale(),
    },
    {
      provide: MAT_CARD_CONFIG,
      useValue: {
        appearance: "outlined",
      },
    },
  ],
};
