import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberEntity } from '@domain/member/member.entity';

@Module({
	imports: [
		TypeOrmModule.forRoot({
			type: 'postgres',
			url: process.env.POSTGRES_URL,
			entities: [MemberEntity],
			synchronize: true,
			autoLoadEntities: true,
			logging: process.env.NODE_ENV === 'development',
		}),
	],
})
export class DatabaseModule {}