// @ts-nocheck

import { useWallet } from '@solana/wallet-adapter-react';
import { Col, Layout, Row, Tabs } from 'antd';
import BN from 'bn.js';
import React, { useState, useMemo } from 'react';
import Masonry from 'react-masonry-css';
import { HowToBuyModal } from '../../components/HowToBuyModal';

import { AuctionViewState, useAuctions, AuctionView } from '../../hooks';

import { AuctionRenderCard } from '../../components/AuctionRenderCard';
import { Link } from 'react-router-dom';
import { CardLoader } from '../../components/MyLoader';
import { useMeta } from '../../contexts';
import { Banner } from '../../components/Banner';

const { TabPane } = Tabs;

const { Content } = Layout;

export enum LiveAuctionViewState {
  All = '0',
  Participated = '1',
  Ended = '2',
  Resale = '3',
  notResale = '3',
}

export const AuctionListView = () => {
  const auctions = useAuctions(AuctionViewState.Live);
  const auctionsEnded = [
    ...useAuctions(AuctionViewState.Ended),
    ...useAuctions(AuctionViewState.BuyNow),
  ];
  const [activeKey, setActiveKey] = useState(LiveAuctionViewState.notResale);
  const { isLoading } = useMeta();
  const { connected, publicKey } = useWallet();
  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1,
  };

  // Check if the auction is primary sale or not
  const checkPrimarySale = (auc: AuctionView) => {
    var flag = 0;
    auc.items.forEach(i => {
      i.forEach(j => {
        if (j.metadata.info.primarySaleHappened == true) {
          flag = 1;
          return true;
        }
      });
      if (flag == 1) return true;
    });
    if (flag == 1) return true;
    else return false;
  };

  const resaleAuctions = auctions
    .sort(
      (a, b) =>
        a.auction.info.endedAt
          ?.sub(b.auction.info.endedAt || new BN(0))
          .toNumber() || 0,
    )
    .filter(m => checkPrimarySale(m) == true);
  const notResaleAuctions = auctions
    .sort(
      (a, b) =>
        a.auction.info.endedAt
          ?.sub(b.auction.info.endedAt || new BN(0))
          .toNumber() || 0,
    )
    .filter(m => checkPrimarySale(m) == false);

  // Removed resales from live auctions
  const liveAuctions = auctions
    .sort(
      (a, b) =>
        a.auction.info.endedAt
          ?.sub(b.auction.info.endedAt || new BN(0))
          .toNumber() || 0,
    )
    .filter(a => !resaleAuctions.includes(a));

  const asStr = publicKey?.toBase58();
  const participated = useMemo(
    () =>
      liveAuctions
        .concat(auctionsEnded)
        .filter((m, idx) =>
          m.auction.info.bidState.bids.find(b => b.key == asStr),
        ),
    [publicKey, auctionsEnded.length],
  );
  let items = liveAuctions;
  switch (activeKey) {
    case LiveAuctionViewState.All:
      items = liveAuctions;
      break;
    case LiveAuctionViewState.Participated:
      items = participated;
      break;
    case LiveAuctionViewState.Resale:
      items = resaleAuctions;
      break;
    case LiveAuctionViewState.notResale:
      items = notResaleAuctions;
      break;
    case LiveAuctionViewState.Ended:
      items = auctionsEnded;
      break;
  }

  const liveAuctionsView = (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="my-masonry-grid"
      columnClassName="my-masonry-grid_column"
    >
      {!isLoading
        ? items.map((m, idx) => {
            const id = m.auction.pubkey;
            return (
              <Link to={`/auction/${id}`} key={idx}>
                <AuctionRenderCard key={id} auctionView={m} />
              </Link>
            );
          })
        : [...Array(10)].map((_, idx) => <CardLoader key={idx} />)}
    </Masonry>
  );
  const endedAuctions = (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="my-masonry-grid"
      columnClassName="my-masonry-grid_column"
    >
      {!isLoading
        ? auctionsEnded.map((m, idx) => {
            const id = m.auction.pubkey;
            return (
              <Link to={`/auction/${id}`} key={idx}>
                <AuctionRenderCard key={id} auctionView={m} />
              </Link>
            );
          })
        : [...Array(10)].map((_, idx) => <CardLoader key={idx} />)}
    </Masonry>
  );

  return (
    <>
      <Banner
        headingText={
          'This is stacc.art, now running on much faster fast metaplex. :)'
        }
        subHeadingText={
          "Also now running a series of instant sales. For the bettermind of peoplekind. Btw y'all can safely and happily trade anything that is fully verified by all creators in the og and proper way that @redacted_j had indicated we should haha. STACC Is A Unlimited Edition (yet #SeemsRare) Mint Project Where New Sets Of Character Classes Are Released Each Generation And Then No Longer Available That Cheap. (Soon As Metaplex Merges Our Shit To Fix a Symptom Introduced By Their Exploit Fix) Players Are (Again) Able To Unlock Hidden Character Classes By Fusing NFTs Together In Various Combinations Of Stats, Equipment & Rarity. Stake Leveling Is Live (Soon, Again...) To Increase Stats To Greater The Chances Of Your Fuse. The Eventual Goal Is A Fully Playable (And Optional PvP) Tactical RPG On The Solana Blockchain. Help Shape The Events Of Eudora!"
        }
        actionComponent={<HowToBuyModal buttonClassName="secondary-btn" />}
        useBannerBg={true}
      />
      <Layout>
        <Content style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Col style={{ width: '100%', marginTop: 32 }}>
            <Row>
              <Tabs
                activeKey={activeKey}
                onTabClick={key => setActiveKey(key as LiveAuctionViewState)}
              >
                <TabPane
                  tab={
                    <>
                      <span className={'live'}></span> OG Mints
                    </>
                  }
                  key={LiveAuctionViewState.notResale}
                >
                  {liveAuctionsView}
                </TabPane>
                {liveAuctions.length > 0 && (
                  <TabPane
                    tab={'OG & Almost OG 2ndary Marketplace'}
                    key={LiveAuctionViewState.All}
                  >
                    {liveAuctionsView}
                  </TabPane>
                )}

                {connected && (
                  <TabPane
                    tab={'Participated'}
                    key={LiveAuctionViewState.Participated}
                  >
                    {liveAuctionsView}
                  </TabPane>
                )}
              </Tabs>
            </Row>
          </Col>
        </Content>
      </Layout>
    </>
  );
};
