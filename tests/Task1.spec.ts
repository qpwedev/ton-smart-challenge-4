import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano, beginCell } from 'ton-core';
import { Task1 } from '../wrappers/Task1';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';


function cell_to_hash(cell: Cell): bigint {
    return BigInt('0x' + cell.hash().toString('hex'));
}

describe('Task1', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Task1');
    });

    let blockchain: Blockchain;
    let task1: SandboxContract<Task1>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        task1 = blockchain.openContract(Task1.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await task1.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task1.address,
            deploy: true,
            success: true,
        });
    });

    it('without ref', async () => {
        const initial_cell = beginCell().endCell();
        const initial_cell_hash = cell_to_hash(initial_cell)

        const stack = await task1.getTree(
            initial_cell_hash,
            initial_cell
        )

        const returned_cell = stack.readCell();

        expect(returned_cell.hash()).toEqual(initial_cell.hash());
    });



    it('one ref', async () => {
        const ref_cell = beginCell()
            .storeInt(777, 16)
            .endCell();

        const initial_cell = beginCell()
            .storeRef(ref_cell)
            .endCell();

        const cell_hash = cell_to_hash(ref_cell)

        const stack = await task1.getTree(
            cell_hash,
            initial_cell
        )

        const returned_cell = stack.readCell();

        expect(cell_to_hash(returned_cell)).toEqual(cell_hash);
    });


    it('second ref on one level', async () => {
        const ref_cell1 = beginCell()
            .storeInt(777, 16)
            .endCell();


        const ref_cell2 = beginCell()
            .storeInt(888, 16)
            .endCell();


        const initial_cell = beginCell()
            .storeRef(ref_cell1)
            .storeRef(ref_cell2)
            .endCell();

        const cell_hash = cell_to_hash(ref_cell2)

        const stack = await task1.getTree(
            cell_hash,
            initial_cell
        )

        const returned_cell = stack.readCell();


        const num = returned_cell.beginParse().loadInt(16);

        console.log(num);

        expect(cell_to_hash(returned_cell)).toEqual(cell_hash);
    });


    it('nested ref', async () => {
        const ref_cell1 = beginCell()
            .storeInt(3, 16)
            .endCell();

        const mid_cell = beginCell()
            .storeInt(2, 16)
            .storeRef(ref_cell1)
            .endCell();

        const initial_cell = beginCell()
            .storeInt(1, 16)
            .storeRef(mid_cell)
            .endCell();

        const cell_hash = cell_to_hash(ref_cell1);

        const stack = await task1.getTree(
            cell_hash,
            initial_cell
        );

        const returned_cell = stack.readCell();

        const num = returned_cell.beginParse().loadInt(16);

        console.log(num);

        expect(cell_to_hash(returned_cell)).toEqual(cell_hash);
    });
});
