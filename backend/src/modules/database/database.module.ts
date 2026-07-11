import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberEntity } from '@domain/member/member.entity';

@Module({
	imports: [
		TypeOrmModule.forRoot({
			type: 'postgres',
			host: process.env.POSTGRES_HOST ?? 'localhost',
			port: Number(process.env.POSTGRES_PORT ?? 5432),
			username: process.env.POSTGRES_USER ?? 'postgres',
			password: process.env.POSTGRES_PASSWORD ?? 'postgres',
			database: process.env.POSTGRES_DB ?? 'exec_dashboard',
			entities: [MemberEntity],
			synchronize: true,
			autoLoadEntities: true,
			logging: process.env.NODE_ENV === 'development',
		}),
	],
})
export class DatabaseModule {}
