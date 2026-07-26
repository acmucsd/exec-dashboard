import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberEntity } from '@domain/member/member.entity';

@Module({
	imports: [
		TypeOrmModule.forRoot({
			type: 'postgres',
            host: process.env.POSTGRES_HOST,
            port: Number(process.env.POSTGRES_PORT),
            database: process.env.POSTGRES_DB,
            username: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
			entities: [MemberEntity],
			synchronize: true,
			autoLoadEntities: true,
			logging: process.env.NODE_ENV === 'development',
		}),
	],
})
export class DatabaseModule {}