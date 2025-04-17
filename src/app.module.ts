import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LoggerMiddleware } from './config/logging.interceptor';
import { RateLimitMiddleware } from './config/rate-limit.middleware';
import { ProjectsModule } from './projects/projects.module';
import { ResourceModule } from './resource/resource.module';
import { ReportModule } from './report/report.module';
import { RiskModule } from './risk/risk.module';
import { BudgetModule } from './budget/budget.module';
import { SkillsModule } from './skills/skills.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    MongooseModule.forRoot(process.env.MONGODB_URI), 
    UsersModule,
    AuthModule,
    ProjectsModule,
    ResourceModule,
    ReportModule,
    RiskModule,
    BudgetModule,
    SkillsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {

    consumer.apply(LoggerMiddleware).forRoutes('*');

    
    consumer.apply((req, res, next) => {
      res.header('Access-Control-Allow-Origin', 'http://localhost:5173'); 
      res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Referrer-Policy','no-referrer');
      if (req.method === 'OPTIONS') {
        res.sendStatus(204);
      } else {
        next();   
      }
    }).forRoutes('*');


    // Applying rate limit to avoid spam login
    // consumer.apply(RateLimitMiddleware).forRoutes('auth/login');
  }
}