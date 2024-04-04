import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { C, NF, NF2 } from "~common";
import { rawDbTable } from "~db/tableNames";
import { Block } from "./Block";
import { Contract } from "./Contract";
import { Transaction } from "./Transaction";

@Entity({ name: rawDbTable._networks })
export class Network {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Index()
  name!: string;
  
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Transaction, (item) => item.blockNumber)
  transactions!: Transaction[];

  @OneToMany(() => Contract, (item) => item.networkId)
  contracts!: Contract[];

  @OneToMany(() => Block, (item) => item.networkId)
  blocks!: Block[];
}

export const CNetwork = C(Network);
export const NNetwork = NF<Network>();
export const PNetwork = NF2<Network>((name) => `${CNetwork}.${name}`);
